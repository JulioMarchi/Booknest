import Link from "next/link";
import { BookOpen } from "lucide-react";
import { siteConfig } from "@/lib/constants";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            <span className="font-display text-base font-semibold tracking-tight">
              {siteConfig.name}
            </span>
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            {siteConfig.tagline}
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
          <Link href="/catalogo" className="hover:text-foreground">
            Catálogo
          </Link>
          <Link href="/catalogo?ordenar=vendidos" className="hover:text-foreground">
            Mais vendidos
          </Link>
          <Link href="/catalogo?ordenar=recentes" className="hover:text-foreground">
            Lançamentos
          </Link>
        </nav>

        <p className="text-xs text-muted-foreground">
          © {year} {siteConfig.name}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
