import Stripe from "stripe";

// Re-export price formatting utilities for backwards compatibility
export { formatPrice, formatPriceFromCents } from "./format-price";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
  // Use fetch-based HTTP client for Vercel serverless compatibility
  httpClient: Stripe.createFetchHttpClient(),
});
