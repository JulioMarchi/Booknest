import Link from "next/link";
import type { Route } from "next";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  title,
  href,
}: {
  title: string;
  href?: Route;
}) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <h2 className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Ver todos <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
