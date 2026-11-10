"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import type { Route } from "next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS, sortLabels, type SortOption } from "@/features/catalog/schemas";
import type { Category } from "@/types";

export function CatalogFilters({
  categories,
  hideCategoryFilter = false,
}: {
  categories: Category[];
  /** Oculta o seletor de categoria quando a página já é /categoria/[slug]. */
  hideCategoryFilter?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentSort = (searchParams.get("ordenar") as SortOption) || "recentes";
  const currentCategory = searchParams.get("categoria") ?? "todas";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "todas" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("pagina");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}` as Route);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {!hideCategoryFilter && (
        <Select value={currentCategory} onValueChange={(v) => updateParam("categoria", v)}>
          <SelectTrigger size="sm" className="min-w-[10rem]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={currentSort} onValueChange={(v) => updateParam("ordenar", v)}>
        <SelectTrigger size="sm" className="min-w-[10rem]">
          <SelectValue placeholder="Ordenar" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {sortLabels[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
