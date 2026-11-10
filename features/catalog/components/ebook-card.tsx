import Link from "next/link";
import Image from "next/image";
import { getPublicCoverUrl } from "@/lib/supabase/storage";
import { formatCurrency, cn } from "@/lib/utils";
import { StarRating } from "./star-rating";
import type { EbookWithRelations } from "@/types";

/**
 * Cartão de eBook — a assinatura visual da BookNest. Cada capa recebe
 * uma "sombra de lombada" (faixa gradiente na borda esquerda, como um
 * livro na estante) e um leve giro ao passar o mouse, em vez do cartão
 * genérico de grid de SaaS. Sem capa enviada, cai num fallback com o
 * título tipografado sobre um gradiente — nunca uma imagem quebrada.
 */
export function EbookCard({ ebook }: { ebook: EbookWithRelations }) {
  const coverUrl = getPublicCoverUrl(ebook.cover);

  return (
    <Link
      href={`/livro/${ebook.slug}`}
      className="group flex flex-col gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className={cn(
          "relative aspect-[2/3] overflow-hidden rounded-md border border-border bg-muted shadow-sm transition-all duration-200 ease-out",
          "group-hover:-translate-y-1 group-hover:-rotate-1 group-hover:shadow-lg",
        )}
      >
        {/* Sombra de lombada */}
        <div className="absolute inset-y-0 left-0 z-10 w-1.5 bg-gradient-to-b from-primary/50 via-primary/10 to-transparent" />
        <div className="absolute inset-y-0 left-1.5 z-10 w-px bg-black/10 dark:bg-white/10" />

        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`Capa de ${ebook.title}`}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 200px"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 via-background to-muted p-4">
            <span className="text-center font-display text-sm font-medium leading-snug text-foreground/80">
              {ebook.title}
            </span>
          </div>
        )}

        {ebook.featured && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground shadow-sm">
            Destaque
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="line-clamp-2 font-display text-sm font-medium leading-snug">
          {ebook.title}
        </h3>
        <StarRating rating={ebook.rating_avg} count={ebook.rating_count} />
        <p className="text-sm font-semibold text-primary">
          {formatCurrency(ebook.price)}
        </p>
      </div>
    </Link>
  );
}
