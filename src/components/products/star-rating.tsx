interface StarRatingProps {
  rating: number | null;
  count: number;
}

export function StarRating({ rating, count }: StarRatingProps) {
  // Don't render anything if there are no reviews — empty stars hurt conversion
  if (!rating || count === 0) return null;

  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: fullStars }).map((_, i) => (
          <svg
            key={`full-${i}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-amber-400"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
        {hasHalf && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            className="text-amber-400"
          >
            <defs>
              <linearGradient id="half-star">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill="url(#half-star)"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <svg
            key={`empty-${i}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-amber-400"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-medium text-foreground">{rating}</span>
      <span className="text-sm text-muted-foreground">
        ({count} {count === 1 ? "review" : "reviews"})
      </span>
    </div>
  );
}
