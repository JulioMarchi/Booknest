import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isRateLimited } from "@/middleware/rate-limit";

/**
 * Rotas que exigem sessão ativa. Prefixos — qualquer sub-rota também
 * é protegida (ex.: /conta/biblioteca, /admin/ebooks/novo).
 */
const PROTECTED_PREFIXES = ["/conta", "/admin"];

/** Rotas restritas ao papel "admin" (checado depois da sessão existir). */
const ADMIN_PREFIXES = ["/admin"];

/** Rotas sensíveis a força-bruta, com limite mais rígido. */
const RATE_LIMITED_ROUTES: Record<string, { max: number; windowSeconds: number }> = {
  "/entrar": { max: 10, windowSeconds: 60 },
  "/cadastro": { max: 5, windowSeconds: 60 },
  "/recuperar-senha": { max: 5, windowSeconds: 300 },
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rateLimitRule = RATE_LIMITED_ROUTES[pathname];
  if (rateLimitRule && request.method === "POST") {
    const limited = await isRateLimited(request, pathname, rateLimitRule);
    if (limited) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em instantes." },
        { status: 429 },
      );
    }
  }

  const { response, user, supabase } = await updateSession(request);

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtected && !user) {
    const redirectUrl = new URL("/entrar", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const isAdminRoute = ADMIN_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isAdminRoute && user) {
    // Não há custom claim de role no JWT ainda (exigiria configurar um
    // Auth Hook no projeto), então a checagem consulta public.users
    // diretamente. RLS permite que o próprio usuário leia sua linha.
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/conta", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas, exceto assets estáticos e otimização de
     * imagem do Next.js, para não desperdiçar execuções de middleware.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif)$).*)",
  ],
};
