import Link from "next/link";
import Image from "next/image";
import { Download } from "lucide-react";
import { getPublicCoverUrl } from "@/lib/supabase/storage";
import { Button } from "@/components/ui/button";
import type { EbookWithRelations } from "@/types";

export function LibraryEbookCard({ ebook }: { ebook: EbookWithRelations }) {
  const coverUrl = getPublicCoverUrl(ebook.cover);

  return (
    <div className="flex flex-col gap-3">
      <Link
        href={`/livro/${ebook.slug}`}
        className="relative aspect-[2/3] overflow-hidden rounded-md border border-border bg-muted shadow-sm"
      >
        <div className="absolute inset-y-0 left-0 z-10 w-1.5 bg-gradient-to-b from-primary/50 via-primary/10 to-transparent" />
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
      </Link>

      <div className="space-y-2">
        <Link href={`/livro/${ebook.slug}`}>
          <h3 className="line-clamp-2 font-display text-sm font-medium leading-snug hover:text-primary">
            {ebook.title}
          </h3>
        </Link>
        <Button asChild size="sm" variant="outline" className="w-full">
          <a href={`/api/download/${ebook.id}`}>
            <Download /> Baixar
          </a>
        </Button>
      </div>
    </div>
  );
}
