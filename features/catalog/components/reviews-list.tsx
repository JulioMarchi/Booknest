import { MessageSquare } from "lucide-react";
import { StarRating } from "./star-rating";
import { EmptyState } from "./empty-state";
import { formatDate } from "@/lib/utils";
import type { Review } from "@/types";

export function ReviewsList({
  reviews,
  ratingAvg,
  ratingCount,
}: {
  reviews: Pick<Review, "id" | "rating" | "comment" | "created_at">[];
  ratingAvg: number;
  ratingCount: number;
}) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Ainda sem avaliações"
        description="Seja o primeiro a avaliar depois de ler este eBook."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="font-display text-3xl font-semibold">
          {ratingAvg.toFixed(1)}
        </span>
        <div>
          <StarRating rating={ratingAvg} count={ratingCount} />
          <p className="text-xs text-muted-foreground">
            {ratingCount} {ratingCount === 1 ? "avaliação" : "avaliações"}
          </p>
        </div>
      </div>

      <ul className="space-y-4">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-md border border-border p-4">
            <div className="flex items-center justify-between">
              <StarRating rating={review.rating} count={1} />
              <span className="text-xs text-muted-foreground">
                {formatDate(review.created_at)}
              </span>
            </div>
            {review.comment && (
              <p className="mt-2 text-sm leading-relaxed">{review.comment}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
