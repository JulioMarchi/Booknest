"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Route } from "next";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const SEARCHABLE_PATHS = ["/busca", "/catalogo"];

/**
 * Busca instantânea: atualiza a URL (?q=) com debounce a cada tecla,
 * o que dispara uma nova busca no servidor (full-text search do
 * Postgres) sem precisar de botão. Fora de /busca ou /catalogo, digitar
 * navega para /busca assim que houver texto.
 */
export function SearchForm({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const isFirstRender = useRef(true);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const handle = setTimeout(() => {
      const onSearchablePath = SEARCHABLE_PATHS.includes(pathname);
      const trimmed = value.trim();

      if (!trimmed && !onSearchablePath) return;

      const targetPath = onSearchablePath ? pathname : "/busca";
      const params = new URLSearchParams(onSearchablePath ? searchParams.toString() : "");

      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      params.delete("pagina");

      startTransition(() => {
        router.push(`${targetPath}?${params.toString()}` as Route);
      });
    }, 350);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só o valor digitado deve reiniciar o debounce
  }, [value]);

  return (
    <div className="relative w-full max-w-sm">
      {isPending ? (
        <Loader2 className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        type="search"
        placeholder="Buscar eBooks…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9"
        aria-label="Buscar eBooks"
      />
    </div>
  );
}
