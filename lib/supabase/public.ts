import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente sem estado de sessão (sem cookies) — usado apenas para dados
 * 100% públicos que não dependem de quem está pedindo (ex.: categorias).
 * Necessário porque o client normal (lib/supabase/server.ts) chama
 * `cookies()`, que não pode ser usado dentro de uma função envolvida
 * por `unstable_cache` (o resultado seria cacheado por request, o que
 * anula o propósito do cache).
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
