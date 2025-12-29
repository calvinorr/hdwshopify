import { NextResponse } from "next/server";

export async function GET() {
  const keyExists = !!process.env.STRIPE_SECRET_KEY;
  const keyPrefix = process.env.STRIPE_SECRET_KEY?.substring(0, 10) || "NOT_SET";
  const keyLength = process.env.STRIPE_SECRET_KEY?.length || 0;

  let stripeTest = "not tested";

  if (keyExists) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        typescript: true,
      });

      // Simple test - list balance
      const balance = await stripe.balance.retrieve();
      stripeTest = `OK - available: ${balance.available[0]?.amount || 0}`;
    } catch (error) {
      stripeTest = `ERROR: ${error instanceof Error ? error.message : "Unknown"}`;
    }
  }

  return NextResponse.json({
    keyExists,
    keyPrefix,
    keyLength,
    stripeTest,
    nodeEnv: process.env.NODE_ENV,
  });
}
