import { createClient } from "@/lib/supabase/server";
import type { UserProfile, DailyRevenue, MonthlyRevenue } from "@/types";

/**
 * Todas as consultas aqui usam o client autenticado normal, não o
 * admin/service-role — a RLS já garante visão total pra quem tem
 * role = 'admin' (ver migrações 0005/0008/0009). Reservar a service
 * role só para os casos que realmente precisam ignorar RLS (webhook,
 * signed URLs) mantém o princípio de menor privilégio.
 */

export async function getDashboardStats() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: publishedEbooks },
    { count: totalDownloads },
    { data: totals },
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase
      .from("ebooks")
      .select("id", { count: "exact", head: true })
      .eq("published", true),
    supabase.from("downloads").select("id", { count: "exact", head: true }),
    supabase.from("v_dashboard_totals").select("*").single(),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    publishedEbooks: publishedEbooks ?? 0,
    totalDownloads: totalDownloads ?? 0,
    totalRevenue: totals?.total_revenue ?? 0,
    totalSales: totals?.total_sales ?? 0,
  };
}

export async function getDailyRevenue(days = 30): Promise<DailyRevenue[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_daily_revenue")
    .select("*")
    .order("day", { ascending: false })
    .limit(days);
  return (data ?? []).reverse();
}

export async function getMonthlyRevenue(months = 12): Promise<MonthlyRevenue[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_monthly_revenue")
    .select("*")
    .order("month", { ascending: false })
    .limit(months);
  return (data ?? []).reverse();
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllUsers:", error.message);
    return [];
  }
  return data ?? [];
}

export type AdminSaleRow = {
  id: string;
  value: number;
  created_at: string;
  users: { name: string; email: string } | null;
  ebooks: { title: string; slug: string } | null;
  coupons: { code: string } | null;
};

export async function getAllSales(): Promise<AdminSaleRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchases")
    .select("id, value, created_at, users(name, email), ebooks(title, slug), coupons(code)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("getAllSales:", error.message);
    return [];
  }
  return (data ?? []) as unknown as AdminSaleRow[];
}

export type AdminEbookRow = {
  id: string;
  title: string;
  slug: string;
  cover: string | null;
  price: number;
  published: boolean;
  featured: boolean;
  sales_count: number;
  created_at: string;
  categories: { name: string } | null;
};

export async function getAdminEbooks(): Promise<AdminEbookRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ebooks")
    .select(
      "id, title, slug, cover, price, published, featured, sales_count, created_at, categories(name)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAdminEbooks:", error.message);
    return [];
  }
  return (data ?? []) as unknown as AdminEbookRow[];
}

export async function getEbookForEdit(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ebooks").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("getEbookForEdit:", error.message);
    return null;
  }
  return data;
}
