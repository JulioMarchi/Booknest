import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Mesma função `check_rate_limit` usada pelo middleware, mas chamável
 * diretamente de Server Actions/Route Handlers que não têm um pathname
 * fixo pra usar como chave (ex.: uma Server Action numa rota dinâmica
 * como /livro/[slug]).
 */
export async function checkRateLimit(
  key: string,
  { max, windowSeconds }: { max: number; windowSeconds: number },
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("checkRateLimit falhou:", error.message);
    return true; // não bloqueia o usuário legítimo por falha do rate limiter
  }

  return data === true;
}
