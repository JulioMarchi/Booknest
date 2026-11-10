import type { Metadata } from "next";
import {
  catalogSearchParamsSchema,
  flattenSearchParams,
} from "@/features/catalog/schemas";
import { searchEbooks } from "@/services/ebooks";
import { SearchForm } from "@/features/store/components/search-form";
import { CatalogResults } from "@/features/catalog/components/catalog-results";

export const metadata: Metadata = {
  title: "Buscar",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const params = catalogSearchParamsSchema.parse(flattenSearchParams(raw));

  const { ebooks, total, totalPages } = params.q
    ? await searchEbooks(params)
    : { ebooks: [], total: 0, totalPages: 0 };

  function buildHref(page: number) {
    const p = new URLSearchParams();
    if (params.q) p.set("q", params.q);
    if (params.ordenar !== "recentes") p.set("ordenar", params.ordenar);
    if (page > 1) p.set("pagina", String(page));
    return `/busca?${p.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Buscar
        </h1>
        <SearchForm initialQuery={params.q ?? ""} />
      </div>

      {params.q ? (
        <CatalogResults
          ebooks={ebooks}
          total={total}
          totalPages={totalPages}
          currentPage={params.pagina}
          buildHref={buildHref}
          emptyTitle={`Nada encontrado para "${params.q}"`}
          emptyDescription="Tente outros termos, ou explore o catálogo completo."
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Digite algo acima para buscar entre os eBooks disponíveis.
        </p>
      )}
    </div>
  );
}
