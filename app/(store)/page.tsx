import Link from "next/link";
import {
  getFeaturedEbooks,
  getBestSellers,
  getNewReleases,
  getCategories,
} from "@/services/ebooks";
import { Hero } from "@/features/store/components/hero";
import { SectionHeading } from "@/features/store/components/section-heading";
import { EbookGrid } from "@/features/catalog/components/ebook-grid";
import { EmptyState } from "@/features/catalog/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Library } from "lucide-react";

export const revalidate = 60;

export default async function HomePage() {
  const [featured, bestSellers, newReleases, categories] = await Promise.all([
    getFeaturedEbooks(3),
    getBestSellers(8),
    getNewReleases(8),
    getCategories(),
  ]);

  const catalogIsEmpty =
    featured.length === 0 && bestSellers.length === 0 && newReleases.length === 0;

  return (
    <>
      <Hero featured={featured} />

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-16 sm:px-6">
        {catalogIsEmpty && (
          <EmptyState
            icon={Library}
            title="O catálogo está sendo preparado"
            description="Em breve os primeiros eBooks chegam por aqui. Volte em instantes."
          />
        )}

        {bestSellers.length > 0 && (
          <section>
            <SectionHeading title="Mais vendidos" href="/catalogo?ordenar=vendidos" />
            <EbookGrid ebooks={bestSellers} />
          </section>
        )}

        {newReleases.length > 0 && (
          <section>
            <SectionHeading title="Lançamentos" href="/catalogo?ordenar=recentes" />
            <EbookGrid ebooks={newReleases} />
          </section>
        )}

        {categories.length > 0 && (
          <section>
            <SectionHeading title="Categorias" />
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link key={category.id} href={`/categoria/${category.slug}`}>
                  <Badge
                    variant="outline"
                    className="px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
                  >
                    {category.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
