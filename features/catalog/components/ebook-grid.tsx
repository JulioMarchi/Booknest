import { SearchX } from "lucide-react";
import { EbookCard } from "./ebook-card";
import { EmptyState } from "./empty-state";
import type { EbookWithRelations } from "@/types";

export function EbookGrid({
  ebooks,
  emptyTitle = "Nenhum eBook encontrado",
  emptyDescription = "Assim que novos títulos forem publicados, eles aparecem aqui.",
}: {
  ebooks: EbookWithRelations[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (ebooks.length === 0) {
    return (
      <EmptyState icon={SearchX} title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {ebooks.map((ebook) => (
        <EbookCard key={ebook.id} ebook={ebook} />
      ))}
    </div>
  );
}
