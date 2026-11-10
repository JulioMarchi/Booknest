import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserLibrary } from "@/services/account";
import { LibraryEbookCard } from "@/features/account/components/library-ebook-card";
import { EmptyState } from "@/features/catalog/components/empty-state";

export const metadata: Metadata = {
  title: "Biblioteca",
};

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const library = await getUserLibrary(user.id);

  if (library.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Sua biblioteca está vazia"
        description="Os eBooks que você comprar aparecem aqui, prontos para baixar."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {library.map((ebook) => (
        <LibraryEbookCard key={ebook.id} ebook={ebook} />
      ))}
    </div>
  );
}
