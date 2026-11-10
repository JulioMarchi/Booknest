import { siteConfig } from "@/lib/constants";

/**
 * Resolve o caminho salvo em `ebooks.cover` (bucket público "covers")
 * para uma URL completa que o next/image consegue otimizar. Retorna
 * null se não houver capa — os componentes decidem o fallback visual.
 */
export function getPublicCoverUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? siteConfig.url;
  return `${supabaseUrl}/storage/v1/object/public/covers/${path}`;
}
