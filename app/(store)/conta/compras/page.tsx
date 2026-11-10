import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserPurchaseHistory } from "@/services/account";
import { getPublicCoverUrl } from "@/lib/supabase/storage";
import { EmptyState } from "@/features/catalog/components/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Histórico de compras",
};

export default async function PurchaseHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const purchases = await getUserPurchaseHistory(user.id);

  if (purchases.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Nenhuma compra ainda"
        description="Suas compras aparecem aqui assim que forem confirmadas."
      />
    );
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {purchases.map((purchase) => {
        const coverUrl = getPublicCoverUrl(purchase.ebooks?.cover);
        return (
          <li key={purchase.id} className="flex items-center gap-4 p-4">
            <div className="relative size-14 shrink-0 overflow-hidden rounded border border-border bg-muted">
              {coverUrl ? (
                <Image src={coverUrl} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 to-muted" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              {purchase.ebooks ? (
                <Link
                  href={`/livro/${purchase.ebooks.slug}`}
                  className="truncate font-medium hover:text-primary"
                >
                  {purchase.ebooks.title}
                </Link>
              ) : (
                <span className="text-muted-foreground">eBook removido</span>
              )}
              <p className="text-xs text-muted-foreground">
                {formatDate(purchase.created_at)}
              </p>
            </div>

            <span className="shrink-0 font-medium">{formatCurrency(purchase.value)}</span>
          </li>
        );
      })}
    </ul>
  );
}
