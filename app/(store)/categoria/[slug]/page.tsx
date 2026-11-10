import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  searchEbooks,
  getCategories,
  getCategoryBySlug,
} from "@/services/ebooks";
import {
  catalogSearchParamsSchema,
  flattenSearchParams,
} from "@/features/catalog/schemas";
import { CatalogFilters } from "@/features/catalog/components/catalog-filters";
import { CatalogResults } from "@/features/catalog/components/catalog-results";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Categoria" };

  return {
    title: category.name,
    description: `eBooks da categoria ${category.name} na BookNest.`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const raw = await searchParams;
  const parsedParams = catalogSearchParamsSchema.parse(flattenSearchParams(raw));
  const effectiveParams = { ...parsedParams, categoria: slug };

  const [{ ebooks, total, totalPages }, categories] = await Promise.all([
    searchEbooks(effectiveParams),
    getCategories(),
  ]);

  function buildHref(page: number) {
    const p = new URLSearchParams();
    if (parsedParams.q) p.set("q", parsedParams.q);
    if (parsedParams.ordenar !== "recentes") p.set("ordenar", parsedParams.ordenar);
    if (page > 1) p.set("pagina", String(page));
    const qs = p.toString();
    return qs ? `/categoria/${slug}?${qs}` : `/categoria/${slug}`;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {category.name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          eBooks da categoria {category.name}.
        </p>
      </div>

      <CatalogFilters categories={categories} hideCategoryFilter />

      <CatalogResults
        ebooks={ebooks}
        total={total}
        totalPages={totalPages}
        currentPage={parsedParams.pagina}
        buildHref={buildHref}
        emptyTitle={`Nenhum eBook em ${category.name} ainda`}
        emptyDescription="Assim que novos títulos forem publicados nessa categoria, eles aparecem aqui."
      />
    </div>
  );
}
