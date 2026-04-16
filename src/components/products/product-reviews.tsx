"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  admin_response?: string | null;
  created_at: string;
}

interface ProductReviewsProps {
  reviews: Review[];
  averageRating: number;
  totalCount: number;
}

const PAGE_SIZE = 5;

export function ProductReviews({
  reviews,
  averageRating,
  totalCount,
}: ProductReviewsProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [starFilter, setStarFilter] = useState<number | null>(null);

  if (reviews.length === 0) return null;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const filtered = starFilter
    ? reviews.filter((r) => r.rating === starFilter)
    : reviews;
  const visibleReviews = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const remaining = filtered.length - visibleCount;

  function handleFilter(star: number) {
    setStarFilter(starFilter === star ? null : star);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div>
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Customer Reviews
      </h2>

      {/* Summary */}
      <div className="mb-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
        {/* Average */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl font-bold tabular-nums">
            {averageRating.toFixed(1)}
          </span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={i < Math.round(averageRating) ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1"
                className="text-amber-400"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "review" : "reviews"}
          </span>
        </div>

        {/* Distribution bars — clickable to filter */}
        <div className="flex flex-1 flex-col gap-1.5">
          {distribution.map(({ star, count }) => {
            const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
            const isActive = starFilter === star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => handleFilter(star)}
                disabled={count === 0}
                className={cn(
                  "flex items-center gap-2 rounded-md px-1.5 py-0.5 text-sm transition-colors",
                  isActive && "bg-muted",
                  count === 0
                    ? "cursor-default opacity-40"
                    : "cursor-pointer hover:bg-muted/60"
                )}
              >
                <span className="w-4 text-right text-muted-foreground">
                  {star}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="shrink-0 text-amber-400"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-muted-foreground tabular-nums">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active filter indicator */}
      {starFilter && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {filtered.length} {starFilter}-star{" "}
            {filtered.length === 1 ? "review" : "reviews"}
          </span>
          <button
            type="button"
            onClick={() => {
              setStarFilter(null);
              setVisibleCount(PAGE_SIZE);
            }}
            className="text-sm font-medium text-foreground underline underline-offset-2"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Individual reviews */}
      <div className="space-y-6">
        {visibleReviews.map((review) => (
          <div key={review.id} className="border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill={i < review.rating ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-amber-400"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <h3 className="mt-2 text-sm font-semibold">{review.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {review.body}
            </p>
            {review.admin_response && (
              <div className="mt-3 rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Response from seller
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {review.admin_response}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show more */}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            Show More Reviews ({remaining})
          </Button>
        </div>
      )}
    </div>
  );
}
