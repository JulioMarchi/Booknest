import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

/**
 * Rate limiting persistido no Postgres (função `check_rate_limit`,
 * ver supabase/migrations/0004_functions_and_triggers.sql). Não depende
 * de um serviço externo (Redis/Upstash) — usa a mesma infraestrutura
 * Supabase já conectada, o que é suficiente para o volume de rotas
 * sensíveis (login, recuperação de senha, checkout) sem adicionar
 * mais uma peça à stack.
 *
 * Identifica o requisitante pelo IP (cabeçalho enviado pela Vercel).
 * A migração 0008 revogou EXECUTE de anon/authenticated nesta função
 * (evita que qualquer visitante "trave" o limite de outra pessoa via
 * RPC direta) — por isso o middleware usa a service role aqui. É
 * seguro porque o middleware roda inteiramente no servidor (Edge),
 * nunca no browser.
 */
export async function isRateLimited(
  request: NextRequest,
  bucket: string,
  { max, windowSeconds }: { max: number; windowSeconds: number },
): Promise<boolean> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const key = `${bucket}:${ip}`;

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    // Em caso de falha no banco, não bloqueia o usuário legítimo —
    // apenas deixa de aplicar o limite para esta requisição.
    console.error("check_rate_limit falhou:", error.message);
    return false;
  }

  return data === false;
}
