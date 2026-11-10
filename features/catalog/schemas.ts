import { z } from "zod";

export const SORT_OPTIONS = [
  "recentes",
  "vendidos",
  "avaliacao",
  "preco-asc",
  "preco-desc",
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

export const sortLabels: Record<SortOption, string> = {
  recentes: "Lançamentos",
  vendidos: "Mais vendidos",
  avaliacao: "Melhor avaliados",
  "preco-asc": "Menor preço",
  "preco-desc": "Maior preço",
};

export const PAGE_SIZE = 12;

/**
 * searchParams do Next.js chegam como string | string[] | undefined —
 * este schema normaliza e valida tudo antes de qualquer query no banco,
 * com fallback seguro (`.catch`) em vez de deixar entrada inválida virar
 * erro 500.
 */
export const catalogSearchParamsSchema = z.object({
  q: z
    .string()
    .trim()
    .max(200)
    .optional()
    .catch(undefined),
  categoria: z.string().trim().max(100).optional().catch(undefined),
  ordenar: z.enum(SORT_OPTIONS).catch("recentes"),
  pagina: z.coerce.number().int().min(1).catch(1),
});

export type CatalogSearchParams = z.infer<typeof catalogSearchParamsSchema>;

/** Normaliza o shape bruto de `searchParams` (Next.js) para string simples. */
export function flattenSearchParams(
  raw: Record<string, string | string[] | undefined>,
) {
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
}
