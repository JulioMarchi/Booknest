import { Fraunces, Inter } from "next/font/google";

/**
 * Fraunces — serifada editorial com ink traps, usada nos títulos e no
 * hero da loja. É a peça de identidade que diferencia o BookNest de um
 * SaaS genérico: remete a tipografia de capa de livro impresso.
 */
export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

/**
 * Inter — sem serifa neutra para corpo de texto, formulários, navegação
 * e dados tabulares (dashboard). Não compete com a Fraunces.
 */
export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
