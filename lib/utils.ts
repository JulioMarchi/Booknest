import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes condicionalmente (clsx) e resolve conflitos de
 * utilitários do Tailwind (twMerge). Usado por todos os componentes de UI.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata um valor numérico como moeda brasileira (R$). */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Formata uma data ISO/Date no padrão brasileiro (dd/mm/aaaa). */
export function formatDate(date: string | Date): string {
  const parsed = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

/** Trunca um texto em N caracteres, preservando palavras inteiras. */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const trimmed = text.slice(0, maxLength);
  return `${trimmed.slice(0, trimmed.lastIndexOf(" "))}…`;
}

/** Gera as iniciais de um nome (até 2 letras) para usar em avatares. */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
