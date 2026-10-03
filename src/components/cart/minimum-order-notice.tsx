/** Shown wherever a buyer can head to checkout while the cart is under the store's minimum order. */
export function MinimumOrderNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
    >
      {message}
    </p>
  );
}
