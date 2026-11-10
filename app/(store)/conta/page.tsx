import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid, Heart, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAccountSummary } from "@/services/account";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/constants";
import { getInitials, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Minha conta",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O middleware já garante autenticação para chegar em /conta, mas
  // não aposta cega em "!" — se a sessão sumir no meio da renderização,
  // falha de forma controlada em vez de quebrar com erro de runtime.
  if (!user) {
    return null;
  }

  const [{ data: profile }, summary] = await Promise.all([
    supabase
      .from("users")
      .select("name, email, avatar, role, created_at")
      .eq("id", user.id)
      .single(),
    getAccountSummary(user.id),
  ]);

  const displayName = profile?.name ?? user.email ?? "Leitor";
  const firstName = displayName.split(" ")[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center gap-4">
          <Avatar className="size-14">
            <AvatarImage src={profile?.avatar ?? undefined} alt={displayName} />
            <AvatarFallback className="text-base">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">Olá, {firstName}!</CardTitle>
            <CardDescription>{profile?.email ?? user.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {profile?.role === "admin" && <Badge variant="soft">Administrador</Badge>}
            {profile?.created_at && (
              <span>
                Na {siteConfig.name} desde {formatDate(profile.created_at)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/conta/biblioteca">
          <Card className="transition-colors hover:border-primary">
            <CardContent className="flex items-center gap-4 pt-6">
              <LayoutGrid className="size-8 text-primary" strokeWidth={1.5} />
              <div>
                <p className="font-display text-2xl font-semibold">
                  {summary.purchasesCount}
                </p>
                <p className="text-sm text-muted-foreground">
                  {summary.purchasesCount === 1 ? "eBook na biblioteca" : "eBooks na biblioteca"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/conta/favoritos">
          <Card className="transition-colors hover:border-primary">
            <CardContent className="flex items-center gap-4 pt-6">
              <Heart className="size-8 text-primary" strokeWidth={1.5} />
              <div>
                <p className="font-display text-2xl font-semibold">
                  {summary.favoritesCount}
                </p>
                <p className="text-sm text-muted-foreground">
                  {summary.favoritesCount === 1 ? "favorito" : "favoritos"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Link href="/conta/compras" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
        <Receipt className="size-4" /> Ver histórico completo de compras
      </Link>
    </div>
  );
}
