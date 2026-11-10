import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/services/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Único ponto de gravação da tabela `purchases` (a RLS não permite
 * insert direto do client — ver migração 0005). Assinatura verificada
 * antes de qualquer leitura do corpo como evento real; idempotente via
 * UNIQUE(payment_id) no banco, então reenvios do Stripe não duplicam
 * a compra nem re-creditam o cupom.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error("Webhook do Stripe sem assinatura ou sem secret configurado.");
    return NextResponse.json({ error: "Configuração inválida." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Assinatura do webhook do Stripe inválida ou Stripe mal configurado:", err);
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // payment_status só é "paid" de imediato para métodos síncronos
    // (cartão, que é o único habilitado por enquanto). Se no futuro
    // pix/boleto forem habilitados, isso evita liberar antes da
    // confirmação — o evento async_payment_succeeded trataria esse caso.
    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const ebookId = session.metadata?.ebook_id;
    const userId = session.metadata?.user_id;
    const couponId = session.metadata?.coupon_id ?? null;

    if (!ebookId || !userId) {
      console.error("Webhook checkout.session.completed sem metadata:", session.id);
      return NextResponse.json({ error: "Metadata ausente." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("purchases").insert({
      user_id: userId,
      ebook_id: ebookId,
      payment_id: session.id,
      coupon_id: couponId,
      value: (session.amount_total ?? 0) / 100,
    });

    if (error) {
      // 23505 = unique_violation — este evento já foi processado antes
      // (o Stripe reenvia eventos). Não é uma falha real.
      if (error.code === "23505") {
        return NextResponse.json({ received: true });
      }
      console.error("Falha ao gravar compra a partir do webhook:", error.message);
      return NextResponse.json({ error: "Falha ao gravar compra." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
