"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { LayoutDashboard, Library, Receipt, Users, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/constants";

const links: { href: Route; label: string; icon: typeof LayoutDashboard }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/ebooks", label: "eBooks", icon: Library },
  { href: "/admin/vendas", label: "Vendas", icon: Receipt },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-svh w-56 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="font-display text-lg font-semibold tracking-tight">
          {siteConfig.name}
        </span>
        <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-primary">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Store className="size-4" />
          Voltar à loja
        </Link>
      </div>
    </aside>
  );
}
