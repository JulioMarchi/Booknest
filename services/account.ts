import { createClient } from "@/lib/supabase/server";
import type { EbookWithRelations, Purchase } from "@/types";

/** eBooks comprados pelo usuário — usado na Biblioteca. */
export async function getUserLibrary(userId: string): Promise<EbookWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchases")
    .select("ebooks(*, categories(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getUserLibrary:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => row.ebooks)
    .filter((ebook): ebook is EbookWithRelations => ebook !== null);
}

/** eBooks favoritados pelo usuário. */
export async function getUserFavorites(userId: string): Promise<EbookWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("ebooks(*, categories(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getUserFavorites:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => row.ebooks)
    .filter((ebook): ebook is EbookWithRelations => ebook !== null);
}

export type PurchaseHistoryItem = Pick<Purchase, "id" | "value" | "created_at"> & {
  ebooks: { title: string; slug: string; cover: string | null } | null;
};

/** Contagens rápidas para o card de visão geral (sem trazer as linhas todas). */
export async function getAccountSummary(userId: string) {
  const supabase = await createClient();
  const [{ count: purchasesCount }, { count: favoritesCount }] = await Promise.all([
    supabase
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return {
    purchasesCount: purchasesCount ?? 0,
    favoritesCount: favoritesCount ?? 0,
  };
}

/** Histórico de compras, mais recente primeiro — usado em /conta/compras. */
export async function getUserPurchaseHistory(
  userId: string,
): Promise<PurchaseHistoryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchases")
    .select("id, value, created_at, ebooks(title, slug, cover)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getUserPurchaseHistory:", error.message);
    return [];
  }

  return (data ?? []) as PurchaseHistoryItem[];
}
