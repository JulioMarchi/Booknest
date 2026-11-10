import Link from "next/link";
import type { Route } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-center gap-2 pt-4"
    >
      <Button variant="outline" size="icon" disabled={!hasPrev} asChild={hasPrev}>
        {hasPrev ? (
          <Link href={buildHref(currentPage - 1) as Route} aria-label="Página anterior">
            <ChevronLeft />
          </Link>
        ) : (
          <ChevronLeft />
        )}
      </Button>

      <span className="px-3 text-sm text-muted-foreground">
        Página {currentPage} de {totalPages}
      </span>

      <Button variant="outline" size="icon" disabled={!hasNext} asChild={hasNext}>
        {hasNext ? (
          <Link href={buildHref(currentPage + 1) as Route} aria-label="Próxima página">
            <ChevronRight />
          </Link>
        ) : (
          <ChevronRight className={cn(!hasNext && "opacity-50")} />
        )}
      </Button>
    </nav>
  );
}
