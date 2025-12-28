/**
 * Format a price in the specified currency (client-safe utility)
 */
export function formatPrice(amount: number, currency: string = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatPriceFromCents(cents: number, currency: string = "GBP"): string {
  return formatPrice(cents / 100, currency);
}
