import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserFavorites } from "@/services/account";
import { EbookGrid } from "@/features/catalog/components/ebook-grid";
import { EmptyState } from "@/features/catalog/components/empty-state";

export const metadata: Metadata = {
  title: "Favoritos",
};

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const favorites = await getUserFavorites(user.id);

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Nenhum favorito ainda"
        description="Toque no coração de um eBook no catálogo para guardá-lo aqui."
      />
    );
  }

  return <EbookGrid ebooks={favorites} />;
}
