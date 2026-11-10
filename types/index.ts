import type { Database, Tables, TablesInsert, TablesUpdate } from "./database.types";

export type { Database, Tables, TablesInsert, TablesUpdate };

export type UserProfile = Tables<"users">;
export type Ebook = Tables<"ebooks">;
export type Category = Tables<"categories">;
export type Purchase = Tables<"purchases">;
export type Download = Tables<"downloads">;
export type Review = Tables<"reviews">;
export type Favorite = Tables<"favorites">;
export type Coupon = Tables<"coupons">;
export type DailyRevenue = Tables<"v_daily_revenue">;
export type MonthlyRevenue = Tables<"v_monthly_revenue">;
export type DashboardTotals = Tables<"v_dashboard_totals">;

/** eBook com relações comumente usadas na loja (categoria e avaliações). */
export type EbookWithRelations = Ebook & {
  categories: Category | null;
  reviews?: Pick<Review, "id" | "rating" | "comment" | "user_id" | "created_at">[];
  author?: Pick<UserProfile, "name" | "avatar"> | null;
};
