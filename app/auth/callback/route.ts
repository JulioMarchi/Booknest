import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Ponto único de retorno para: login com Google, confirmação de e-mail
 * de cadastro, e link de recuperação de senha. Todos usam o mesmo
 * fluxo PKCE — trocam um `code` por uma sessão.
 *
 * O parâmetro `next` decide para onde ir depois (ex.: recuperação de
 * senha manda para /redefinir-senha; o resto vai para /conta).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/conta";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/entrar?erro=callback`);
}
