"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { Heart, LayoutGrid, Receipt, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

const links: { href: Route; label: string; icon: typeof User }[] = [
  { href: "/conta", label: "Visão geral", icon: User },
  { href: "/conta/biblioteca", label: "Biblioteca", icon: LayoutGrid },
  { href: "/conta/favoritos", label: "Favoritos", icon: Heart },
  { href: "/conta/compras", label: "Compras", icon: Receipt },
  { href: "/conta/perfil", label: "Perfil", icon: Settings },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border pb-px">
      {links.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
