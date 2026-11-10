import { siteConfig } from "@/lib/constants";
import type { EbookWithRelations } from "@/types";

/** Schema.org WebSite + Organization — injetado no layout raiz. */
export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteConfig.url}/busca?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
      },
    ],
  };
}

/** Schema.org Book — injetado na página de produto. */
export function buildBookSchema(
  ebook: EbookWithRelations,
  pageUrl: string,
  coverUrl: string | null,
) {
  const authorName = ebook.author_name || ebook.author?.name;

  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: ebook.title,
    description: ebook.description,
    url: pageUrl,
    ...(coverUrl && { image: coverUrl }),
    ...(authorName && { author: { "@type": "Person", name: authorName } }),
    ...(ebook.categories && { genre: ebook.categories.name }),
    offers: {
      "@type": "Offer",
      price: ebook.price,
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      url: pageUrl,
    },
    ...(ebook.rating_count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: ebook.rating_avg,
        reviewCount: ebook.rating_count,
      },
    }),
  };
}

/** Componente utilitário pra injetar qualquer objeto JSON-LD na página. */
export function JsonLd({ data }: { data: object }) {
  // Escapa "<" para impedir que um valor contendo "</script>" (ex.: um
  // título de eBook) feche a tag prematuramente no parser de HTML.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
