const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function fmtCurrency(value: number): string {
  return currency.format(value);
}

export function fmtDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
