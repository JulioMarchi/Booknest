import type { Metadata } from "next";
import { searchEbooks, getCategories } from "@/services/ebooks";
import {
  catalogSearchParamsSchema,
  flattenSearchParams,
} from "@/features/catalog/schemas";
import { CatalogFilters } from "@/features/catalog/components/catalog-filters";
import { CatalogResults } from "@/features/catalog/components/catalog-results";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Explore todos os eBooks disponíveis na BookNest.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const params = catalogSearchParamsSchema.parse(flattenSearchParams(raw));

  const [{ ebooks, total, totalPages }, categories] = await Promise.all([
    searchEbooks(params),
    getCategories(),
  ]);

  function buildHref(page: number) {
    const p = new URLSearchParams();
    if (params.q) p.set("q", params.q);
    if (params.categoria) p.set("categoria", params.categoria);
    if (params.ordenar !== "recentes") p.set("ordenar", params.ordenar);
    if (page > 1) p.set("pagina", String(page));
    const qs = p.toString();
    return qs ? `/catalogo?${qs}` : "/catalogo";
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Catálogo
        </h1>
        <p className="mt-1 text-muted-foreground">
          Todos os eBooks disponíveis na {"BookNest"}.
        </p>
      </div>

      <CatalogFilters categories={categories} />

      <CatalogResults
        ebooks={ebooks}
        total={total}
        totalPages={totalPages}
        currentPage={params.pagina}
        buildHref={buildHref}
      />
    </div>
  );
}
