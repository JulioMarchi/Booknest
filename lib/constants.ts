/**
 * Configuração central do site. Único lugar para alterar nome, descrição
 * e URLs usadas em metadata, SEO, e-mails e componentes de navegação.
 */
export const siteConfig = {
  name: "BookNest",
  tagline: "Sua próxima leitura, direto na sua estante digital.",
  description:
    "BookNest é uma plataforma para autores publicarem e venderem eBooks, e para leitores comprarem, acessarem e baixarem seus livros com segurança.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ogImage: "/og/default.png",
  links: {
    twitter: undefined,
    instagram: undefined,
  },
} as const;

/** Limites e regras de negócio compartilhados entre client e server. */
export const businessRules = {
  currency: "BRL",
  reviewRatingMin: 1,
  reviewRatingMax: 5,
  coverMaxSizeMb: 5,
  pdfMaxSizeMb: 200,
  coverAllowedTypes: ["image/jpeg", "image/png", "image/webp"],
  pdfAllowedTypes: ["application/pdf"],
  downloadSignedUrlTtlSeconds: 300,
} as const;

/** Papéis de usuário reconhecidos pelo banco (public.user_role). */
export const USER_ROLES = ["customer", "author", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];
