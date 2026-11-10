import type { Metadata } from "next";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { getAllSales } from "@/services/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/features/catalog/components/empty-state";

export const metadata: Metadata = {
  title: "Vendas",
};

export default async function AdminSalesPage() {
  const sales = await getAllSales();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Vendas</h1>

      {sales.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nenhuma venda ainda"
          description="Assim que a primeira compra for confirmada pelo Stripe, ela aparece aqui."
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">eBook</th>
                <th className="px-4 py-3 font-medium">Cupom</th>
                <th className="px-4 py-3 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(sale.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{sale.users?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{sale.users?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {sale.ebooks ? (
                      <Link href={`/livro/${sale.ebooks.slug}`} className="hover:text-primary">
                        {sale.ebooks.title}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {sale.coupons ? (
                      <Badge variant="outline">{sale.coupons.code}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(sale.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
