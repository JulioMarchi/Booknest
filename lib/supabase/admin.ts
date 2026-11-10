import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente Supabase com a Service Role Key — IGNORA todas as RLS policies.
 *
 * Uso EXCLUSIVO em contextos de confiança total no servidor:
 *  - webhook do Stripe gravando uma compra;
 *  - geração de Signed URLs de download (após validar a compra);
 *  - jobs administrativos.
 *
 * O import "server-only" no topo faz o build falhar caso este módulo
 * seja importado, direta ou indiretamente, por código client-side.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL não configuradas.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
