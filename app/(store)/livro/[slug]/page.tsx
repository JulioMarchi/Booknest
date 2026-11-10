import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import {
  getEbookBySlug,
  getRelatedEbooks,
  getViewerEbookState,
} from "@/services/ebooks";
import { getPublicCoverUrl } from "@/lib/supabase/storage";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/features/catalog/components/star-rating";
import { EbookGrid } from "@/features/catalog/components/ebook-grid";
import { ReviewsList } from "@/features/catalog/components/reviews-list";
import { FavoriteButton } from "@/features/catalog/components/favorite-button";
import { ShareButton } from "@/features/catalog/components/share-button";
import { BuyButton } from "@/features/checkout/components/buy-button";
import { getInitials } from "@/lib/utils";
import { buildBookSchema, JsonLd } from "@/lib/structured-data";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ebook = await getEbookBySlug(slug);
  if (!ebook) return { title: "eBook não encontrado" };

  const coverUrl = getPublicCoverUrl(ebook.cover);

  return {
    title: ebook.title,
    description: ebook.description.slice(0, 155),
    openGraph: {
      title: ebook.title,
      description: ebook.description.slice(0, 155),
      images: coverUrl ? [{ url: coverUrl }] : undefined,
      type: "book",
    },
  };
}

export const revalidate = 60;

export default async function EbookPage({ params }: PageProps) {
  const { slug } = await params;
  const ebook = await getEbookBySlug(slug);
  if (!ebook) notFound();

  const [related, viewerState] = await Promise.all([
    getRelatedEbooks(ebook.id, ebook.category_id, 4),
    getViewerEbookState(ebook.id),
  ]);

  const coverUrl = getPublicCoverUrl(ebook.cover);
  const pageUrl = `${siteConfig.url}/livro/${ebook.slug}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd data={buildBookSchema(ebook, pageUrl, coverUrl)} />
      <div className="grid gap-10 md:grid-cols-[280px_1fr]">
        <div className="relative mx-auto aspect-[2/3] w-full max-w-[280px] overflow-hidden rounded-md border border-border bg-muted shadow-lg md:mx-0">
          <div className="absolute inset-y-0 left-0 z-10 w-2 bg-gradient-to-b from-primary/50 via-primary/10 to-transparent" />
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={`Capa de ${ebook.title}`}
              fill
              sizes="280px"
              priority
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 via-background to-muted p-6">
              <span className="text-center font-display text-lg font-medium leading-snug">
                {ebook.title}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {ebook.categories && (
            <Link href={`/categoria/${ebook.categories.slug}`}>
              <Badge variant="soft">{ebook.categories.name}</Badge>
            </Link>
          )}

          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {ebook.title}
          </h1>

          {(ebook.author_name || ebook.author) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {ebook.author?.avatar && (
                <Avatar className="size-6">
                  <AvatarImage src={ebook.author.avatar} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(ebook.author_name || ebook.author?.name || "")}
                  </AvatarFallback>
                </Avatar>
              )}
              {ebook.author_name || ebook.author?.name}
            </div>
          )}

          <StarRating rating={ebook.rating_avg} count={ebook.rating_count} />

          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            {ebook.description}
          </p>

          <Separator />

          <div className="space-y-4">
            {viewerState.hasPurchased ? (
              <div className="flex items-center gap-3">
                <span className="font-display text-3xl font-semibold text-primary">
                  {formatCurrency(ebook.price)}
                </span>
                <Badge variant="soft" className="gap-1.5 py-1.5 text-sm">
                  <CheckCircle2 className="size-4" /> Já está na sua biblioteca
                </Badge>
              </div>
            ) : (
              <BuyButton ebookId={ebook.id} price={ebook.price} />
            )}

            <div className="flex gap-2">
              <FavoriteButton
                ebookId={ebook.id}
                ebookSlug={ebook.slug}
                initialFavorited={viewerState.isFavorited}
              />
              <ShareButton title={ebook.title} url={pageUrl} />
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-12" />

      <section>
        <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight">
          Avaliações
        </h2>
        <ReviewsList
          reviews={ebook.reviews ?? []}
          ratingAvg={ebook.rating_avg}
          ratingCount={ebook.rating_count}
        />
      </section>

      {related.length > 0 && (
        <>
          <Separator className="my-12" />
          <section>
            <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight">
              Você também pode gostar
            </h2>
            <EbookGrid ebooks={related} />
          </section>
        </>
      )}
    </div>
  );
}
