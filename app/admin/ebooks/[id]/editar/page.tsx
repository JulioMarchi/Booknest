import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories } from "@/services/ebooks";
import { getEbookForEdit } from "@/services/admin";
import { EbookForm } from "@/features/admin/components/ebook-form";
import { updateEbookAction } from "@/features/admin/actions";

export const metadata: Metadata = {
  title: "Editar eBook",
};

type PageProps = { params: Promise<{ id: string }> };

export default async function EditEbookPage({ params }: PageProps) {
  const { id } = await params;
  const [ebook, categories] = await Promise.all([getEbookForEdit(id), getCategories()]);

  if (!ebook) notFound();

  const boundAction = updateEbookAction.bind(null, id);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Editar eBook</h1>
      <EbookForm
        action={boundAction}
        categories={categories}
        submitLabel="Salvar alterações"
        defaultValues={{
          title: ebook.title,
          slug: ebook.slug,
          description: ebook.description,
          category_id: ebook.category_id,
          author_name: ebook.author_name,
          price: ebook.price,
          featured: ebook.featured,
          published: ebook.published,
          cover: ebook.cover,
          pdf: ebook.pdf,
        }}
      />
    </div>
  );
}
