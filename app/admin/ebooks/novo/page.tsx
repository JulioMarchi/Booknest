import type { Metadata } from "next";
import { getCategories } from "@/services/ebooks";
import { EbookForm } from "@/features/admin/components/ebook-form";
import { createEbookAction } from "@/features/admin/actions";

export const metadata: Metadata = {
  title: "Publicar eBook",
};

export default async function NewEbookPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Publicar eBook
      </h1>
      <EbookForm action={createEbookAction} categories={categories} submitLabel="Publicar" />
    </div>
  );
}
