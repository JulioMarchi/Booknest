import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { businessRules } from "@/lib/constants";

/**
 * Único caminho de acesso a um PDF. O bucket "ebooks" é privado (sem
 * policy de SELECT — ver migração 0006); a única forma de ler um
 * objeto é gerar uma Signed URL com a service role, e isso só
 * acontece aqui, depois de confirmar a compra.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ebookId: string }> },
) {
  const { ebookId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const allowed = await checkRateLimit(`download:${user.id}`, {
    max: 20,
    windowSeconds: 60,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitos downloads em pouco tempo. Aguarde um instante." },
      { status: 429 },
    );
  }

  const { data: purchase } = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("ebook_id", ebookId)
    .maybeSingle();

  if (!purchase) {
    return NextResponse.json(
      { error: "Você não possui este eBook." },
      { status: 403 },
    );
  }

  const admin = createAdminClient();

  const { data: ebook } = await admin
    .from("ebooks")
    .select("pdf")
    .eq("id", ebookId)
    .maybeSingle();

  if (!ebook?.pdf) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  const { data: signed, error: signError } = await admin.storage
    .from("ebooks")
    .createSignedUrl(ebook.pdf, businessRules.downloadSignedUrlTtlSeconds, {
      download: true,
    });

  if (signError || !signed?.signedUrl) {
    console.error("Falha ao gerar Signed URL:", signError?.message);
    return NextResponse.json(
      { error: "Não foi possível gerar o link de download." },
      { status: 500 },
    );
  }

  await admin.from("downloads").insert({ ebook_id: ebookId, user_id: user.id });

  return NextResponse.redirect(signed.signedUrl);
}
