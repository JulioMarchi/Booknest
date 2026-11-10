import { EbookGrid } from "./ebook-grid";
import { Pagination } from "./pagination";
import type { EbookWithRelations } from "@/types";

export function CatalogResults({
  ebooks,
  total,
  totalPages,
  currentPage,
  buildHref,
  emptyTitle,
  emptyDescription,
}: {
  ebooks: EbookWithRelations[];
  total: number;
  totalPages: number;
  currentPage: number;
  buildHref: (page: number) => string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  return (
    <div className="space-y-8">
      {total > 0 && (
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "eBook encontrado" : "eBooks encontrados"}
        </p>
      )}

      <EbookGrid
        ebooks={ebooks}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        buildHref={buildHref}
      />
    </div>
  );
}
