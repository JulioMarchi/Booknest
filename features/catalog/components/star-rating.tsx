import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  count,
  className,
}: {
  rating: number;
  count?: number;
  className?: string;
}) {
  if (!count) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        Ainda sem avaliações
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "size-3.5",
              i < Math.round(rating)
                ? "fill-primary text-primary"
                : "fill-none text-border",
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {rating.toFixed(1)} ({count})
      </span>
    </div>
  );
}
