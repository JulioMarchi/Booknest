import type { LucideIcon } from "lucide-react";
import { BookX } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = BookX,
  title,
  description,
  className,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-16 text-center",
        className,
      )}
    >
      <Icon className="size-8 text-muted-foreground" strokeWidth={1.5} />
      <p className="font-display text-lg font-medium">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}
