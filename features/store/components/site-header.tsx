import Link from "next/link";
import { BookOpen, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/services/ebooks";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { SearchForm } from "./search-form";
import { UserMenu } from "./user-menu";
import { siteConfig } from "@/lib/constants";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let profile: {
    name: string;
    email: string;
    avatar: string | null;
    role: "customer" | "author" | "admin";
  } | null = null;

  if (authUser) {
    const { data } = await supabase
      .from("users")
      .select("name, email, avatar, role")
      .eq("id", authUser.id)
      .single();
    profile = data;
  }

  const categories = await getCategories();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <BookOpen className="size-5 text-primary" />
          <span className="font-display text-lg font-semibold tracking-tight">
            {siteConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/catalogo">Catálogo</Link>
          </Button>

          {categories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Categorias <ChevronDown className="size-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
                {categories.map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link href={`/categoria/${category.slug}`}>{category.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button variant="ghost" size="sm" asChild>
            <Link href="/catalogo?ordenar=vendidos">Mais vendidos</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/catalogo?ordenar=recentes">Lançamentos</Link>
          </Button>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <SearchForm />
          </div>
          <ModeToggle />
          <UserMenu user={profile} />
        </div>
      </div>
    </header>
  );
}
