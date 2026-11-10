import type { Metadata } from "next";
import { DollarSign, ShoppingCart, Download, Users, BookMarked } from "lucide-react";
import {
  getDashboardStats,
  getDailyRevenue,
  getMonthlyRevenue,
} from "@/services/admin";
import { StatCard } from "@/features/admin/components/stat-card";
import { RevenueChart } from "@/features/admin/components/revenue-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

const monthNames = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export default async function AdminDashboardPage() {
  const [stats, daily, monthly] = await Promise.all([
    getDashboardStats(),
    getDailyRevenue(30),
    getMonthlyRevenue(12),
  ]);

  const dailyData = daily.map((d) => ({
    label: d.day ? new Date(d.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "",
    total_revenue: d.total_revenue,
  }));

  const monthlyData = monthly.map((m) => {
    const date = m.month ? new Date(m.month) : null;
    return {
      label: date ? `${monthNames[date.getUTCMonth()]}/${String(date.getUTCFullYear()).slice(2)}` : "",
      total_revenue: m.total_revenue,
    };
  });

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={DollarSign} label="Receita total" value={formatCurrency(stats.totalRevenue)} />
        <StatCard icon={ShoppingCart} label="Vendas" value={stats.totalSales} />
        <StatCard icon={Download} label="Downloads" value={stats.totalDownloads} />
        <StatCard icon={Users} label="Usuários" value={stats.totalUsers} />
        <StatCard icon={BookMarked} label="eBooks publicados" value={stats.publishedEbooks} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receita diária (últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={dailyData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receita mensal (últimos 12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={monthlyData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
