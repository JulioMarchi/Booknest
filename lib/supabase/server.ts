import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Cliente Supabase para uso em Server Components, Route Handlers e
 * Server Actions. Lê/escreve cookies de sessão via a API `cookies()` do
 * Next.js. Continua sujeito às RLS policies (usa a chave anônima).
 *
 * Em Server Components puros a escrita de cookies é ignorada (Next.js
 * não permite `set` fora de Server Actions/Route Handlers) — por isso
 * o try/catch: o middleware é quem garante a renovação da sessão nesse
 * caso, então o erro pode ser descartado com segurança.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado a partir de um Server Component — a sessão será
            // renovada pelo middleware na próxima navegação.
          }
        },
      },
    },
  );
}
