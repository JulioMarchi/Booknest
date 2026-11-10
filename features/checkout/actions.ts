"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/services/stripe";
import { getPublicCoverUrl } from "@/lib/supabase/storage";
import { siteConfig } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rate-limit";
import { couponCodeSchema } from "./schemas";

export type CouponState =
  | { status: "valid"; discountType: "percentage" | "fixed"; discountValue: number }
  | { status: "invalid"; message: string };

export async function validateCouponAction(rawCode: string): Promise<CouponState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Limita tentativas por usuário (ou "anon" genérico se deslogado) —
  // validate_coupon é RPC pública de propósito (o checkout precisa
  // dela), então isso mitiga tentativas de adivinhar códigos válidos.
  const allowed = await checkRateLimit(`validate_coupon:${user?.id ?? "anon"}`, {
    max: 15,
    windowSeconds: 60,
  });
  if (!allowed) {
    return { status: "invalid", message: "Muitas tentativas. Aguarde um instante." };
  }

  const parsed = couponCodeSchema.safeParse({ code: rawCode });
  if (!parsed.success) {
    return { status: "invalid", message: "Informe um cupom válido." };
  }

  const { data, error } = await supabase.rpc("validate_coupon", {
    p_code: parsed.data.code,
  });

  if (error || !data || data.length === 0) {
    return { status: "invalid", message: "Cupom inválido, expirado ou esgotado." };
  }

  const coupon = data[0];
  if (!coupon) {
    return { status: "invalid", message: "Cupom inválido, expirado ou esgotado." };
  }

  return {
    status: "valid",
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value,
  };
}

function applyDiscount(
  price: number,
  coupon: { discount_type: "percentage" | "fixed"; discount_value: number } | null,
): number {
  if (!coupon) return price;
  const discounted =
    coupon.discount_type === "percentage"
      ? price * (1 - coupon.discount_value / 100)
      : price - coupon.discount_value;
  return Math.max(0, Math.round(discounted * 100) / 100);
}

export async function createCheckoutSessionAction(
  ebookId: string,
  couponCode?: string,
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: ebook } = await supabase
    .from("ebooks")
    .select("id, slug, title, price, published, cover")
    .eq("id", ebookId)
    .maybeSingle();

  if (!ebook || !ebook.published) {
    return { error: "Este eBook não está disponível para compra." };
  }

  if (!user) {
    redirect(`/entrar?redirectTo=/livro/${ebook.slug}` as Route);
  }

  const { data: existingPurchase } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("ebook_id", ebookId)
    .maybeSingle();

  if (existingPurchase) {
    redirect("/conta");
  }

  let couponId: string | null = null;
  let couponRow: { id: string; discount_type: "percentage" | "fixed"; discount_value: number } | null = null;

  if (couponCode) {
    const parsed = couponCodeSchema.safeParse({ code: couponCode });
    if (parsed.success) {
      const { data: couponRows } = await supabase.rpc("validate_coupon", {
        p_code: parsed.data.code,
      });
      const firstRow = couponRows?.[0];
      if (firstRow) {
        couponRow = firstRow;
        couponId = firstRow.id;
      }
    }
  }

  const finalAmount = applyDiscount(ebook.price, couponRow);

  // Cupom de 100%: não existe cobrança pra criar no Stripe — libera
  // o eBook direto, usando o client admin (mesmo caminho de confiança
  // do webhook), já que RLS não permite insert direto do cliente.
  if (finalAmount <= 0) {
    const admin = createAdminClient();
    const { error } = await admin.from("purchases").insert({
      user_id: user.id,
      ebook_id: ebook.id,
      payment_id: `coupon_${couponId}_${randomUUID()}`,
      coupon_id: couponId,
      value: 0,
    });

    if (error) {
      return { error: "Não foi possível concluir o resgate do cupom." };
    }

    redirect(`/checkout/sucesso?free=true`);
  }

  const coverUrl = getPublicCoverUrl(ebook.cover);

  let session;
  try {
    const stripe = getStripe();
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: ebook.title,
              images: coverUrl ? [coverUrl] : undefined,
            },
            unit_amount: Math.round(finalAmount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        ebook_id: ebook.id,
        user_id: user.id,
        ...(couponId ? { coupon_id: couponId } : {}),
      },
      success_url: `${siteConfig.url}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteConfig.url}/livro/${ebook.slug}?checkout=cancelado`,
    });
  } catch (err) {
    console.error("Erro ao criar sessão de checkout:", err);
    return { error: "Não foi possível iniciar o checkout. Tente novamente." };
  }

  if (!session.url) {
    return { error: "Não foi possível iniciar o checkout." };
  }

  // URL externa (checkout.stripe.com) — não é uma rota interna, então
  // o tipo RouteImpl do typedRoutes não se aplica aqui.
  redirect(session.url as Route);
}
