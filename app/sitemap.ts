import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: ebooks }, { data: categories }] = await Promise.all([
    supabase.from("ebooks").select("slug, updated_at").eq("published", true),
    supabase.from("categories").select("slug"),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteConfig.url, changeFrequency: "daily", priority: 1 },
    { url: `${siteConfig.url}/catalogo`, changeFrequency: "daily", priority: 0.9 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map((category) => ({
    url: `${siteConfig.url}/categoria/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const ebookRoutes: MetadataRoute.Sitemap = (ebooks ?? []).map((ebook) => ({
    url: `${siteConfig.url}/livro/${ebook.slug}`,
    lastModified: ebook.updated_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...ebookRoutes];
}
