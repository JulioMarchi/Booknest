import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Star, Library } from "lucide-react";
import { getAdminEbooks } from "@/services/admin";
import { getPublicCoverUrl } from "@/lib/supabase/storage";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/features/catalog/components/empty-state";
import { DeleteEbookButton } from "@/features/admin/components/delete-ebook-button";

export const metadata: Metadata = {
  title: "eBooks",
};

export default async function AdminEbooksPage() {
  const ebooks = await getAdminEbooks();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tight">eBooks</h1>
        <Button asChild>
          <Link href="/admin/ebooks/novo">
            <Plus /> Publicar eBook
          </Link>
        </Button>
      </div>

      {ebooks.length === 0 ? (
        <EmptyState
          icon={Library}
          title="Nenhum eBook cadastrado"
          description="Publique o primeiro eBook para ele aparecer na loja."
        >
          <Button asChild className="mt-2">
            <Link href="/admin/ebooks/novo">
              <Plus /> Publicar eBook
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">eBook</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium">Vendas</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Publicado em</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ebooks.map((ebook) => {
                const coverUrl = getPublicCoverUrl(ebook.cover);
                return (
                  <tr key={ebook.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded border border-border bg-muted">
                          {coverUrl && (
                            <Image src={coverUrl} alt="" fill sizes="40px" className="object-cover" />
                          )}
                        </div>
                        <span className="flex items-center gap-1.5 font-medium">
                          {ebook.title}
                          {ebook.featured && (
                            <Star className="size-3.5 fill-primary text-primary" />
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {ebook.categories?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">{formatCurrency(ebook.price)}</td>
                    <td className="px-4 py-3">{ebook.sales_count}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ebook.published ? "soft" : "secondary"}>
                        {ebook.published ? "Publicado" : "Rascunho"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(ebook.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/ebooks/${ebook.id}/editar`} aria-label="Editar">
                            <Pencil />
                          </Link>
                        </Button>
                        <DeleteEbookButton ebookId={ebook.id} title={ebook.title} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
