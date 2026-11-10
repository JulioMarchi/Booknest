"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function toggleFavoriteAction(
  ebookId: string,
  ebookSlug: string,
): Promise<{ favorited: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/entrar?redirectTo=/livro/${ebookSlug}`);
  }

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("ebook_id", ebookId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
    if (error) return { error: "Não foi possível remover dos favoritos." };
    revalidatePath(`/livro/${ebookSlug}`);
    return { favorited: false };
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, ebook_id: ebookId });

  if (error) return { error: "Não foi possível adicionar aos favoritos." };
  revalidatePath(`/livro/${ebookSlug}`);
  return { favorited: true };
}
