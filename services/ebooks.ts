import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { PAGE_SIZE, type CatalogSearchParams } from "@/features/catalog/schemas";
import type { Category, EbookWithRelations } from "@/types";

/**
 * Camada de dados da loja. Todas as consultas filtram `published = true`
 * explicitamente no código (além da RLS, que já garante isso por padrão
 * para quem não é autor/admin) — defesa em profundidade e clareza de
 * intenção para quem ler a query depois.
 */

/**
 * Categorias mudam raramente e são lidas em toda página (o header as
 * usa no dropdown). Cacheado por 5 minutos para tirar essa query do
 * caminho crítico da maioria das requisições. Usa o client público
 * (sem cookies) — obrigatório dentro de unstable_cache.
 */
export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("getCategories:", error.message);
      return [];
    }
    return data ?? [];
  },
  ["categories-list"],
  { revalidate: 300, tags: ["categories"] },
);

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ?? null;
}

export async function getFeaturedEbooks(limit = 4): Promise<EbookWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ebooks")
    .select("*, categories(*)")
    .eq("published", true)
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getFeaturedEbooks:", error.message);
    return [];
  }
  return (data as EbookWithRelations[]) ?? [];
}

export async function getBestSellers(limit = 8): Promise<EbookWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ebooks")
    .select("*, categories(*)")
    .eq("published", true)
    .gt("sales_count", 0)
    .order("sales_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getBestSellers:", error.message);
    return [];
  }
  return (data as EbookWithRelations[]) ?? [];
}

export async function getNewReleases(limit = 8): Promise<EbookWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ebooks")
    .select("*, categories(*)")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getNewReleases:", error.message);
    return [];
  }
  return (data as EbookWithRelations[]) ?? [];
}

type CatalogResult = {
  ebooks: EbookWithRelations[];
  total: number;
  totalPages: number;
};

/**
 * Query principal do catálogo — usada por /catalogo, /categoria/[slug]
 * e /busca. `categoria`, quando presente, faz inner join com
 * categories (só assim dá pra filtrar pelo slug da relação); sem
 * filtro de categoria, o join é left, pra não esconder eBooks sem
 * categoria definida.
 */
export async function searchEbooks(
  params: CatalogSearchParams,
): Promise<CatalogResult> {
  const supabase = await createClient();
  const { q, categoria, ordenar, pagina } = params;

  const selectClause = categoria ? "*, categories!inner(*)" : "*, categories(*)";

  let query = supabase
    .from("ebooks")
    .select(selectClause, { count: "exact" })
    .eq("published", true);

  if (categoria) {
    query = query.eq("categories.slug", categoria);
  }

  if (q) {
    query = query.textSearch("search_vector", q, {
      type: "websearch",
      config: "portuguese",
    });
  }

  switch (ordenar) {
    case "vendidos":
      query = query.order("sales_count", { ascending: false });
      break;
    case "avaliacao":
      query = query.order("rating_avg", { ascending: false });
      break;
    case "preco-asc":
      query = query.order("price", { ascending: true });
      break;
    case "preco-desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (pagina - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("searchEbooks:", error.message);
    return { ebooks: [], total: 0, totalPages: 0 };
  }

  const total = count ?? 0;
  return {
    ebooks: (data as unknown as EbookWithRelations[]) ?? [],
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getEbookBySlug(
  slug: string,
): Promise<EbookWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ebooks")
    .select(
      "*, categories(*), author:users!ebooks_author_id_fkey(name, avatar), reviews(id, rating, comment, user_id, created_at)",
    )
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error("getEbookBySlug:", error.message);
    return null;
  }
  return data as unknown as EbookWithRelations | null;
}

/**
 * Estado do visitante atual em relação a um eBook (já comprou? já
 * favoritou?). Usado na página de produto para decidir entre mostrar
 * o botão de compra ou o aviso de que já está na biblioteca.
 */
export async function getViewerEbookState(ebookId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAuthenticated: false, hasPurchased: false, isFavorited: false };
  }

  const [{ data: purchase }, { data: favorite }] = await Promise.all([
    supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("ebook_id", ebookId)
      .maybeSingle(),
    supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("ebook_id", ebookId)
      .maybeSingle(),
  ]);

  return {
    isAuthenticated: true,
    hasPurchased: !!purchase,
    isFavorited: !!favorite,
  };
}

export async function getRelatedEbooks(
  ebookId: string,
  categoryId: string | null,
  limit = 4,
): Promise<EbookWithRelations[]> {
  if (!categoryId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ebooks")
    .select("*, categories(*)")
    .eq("published", true)
    .eq("category_id", categoryId)
    .neq("id", ebookId)
    .order("sales_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRelatedEbooks:", error.message);
    return [];
  }
  return (data as EbookWithRelations[]) ?? [];
}
