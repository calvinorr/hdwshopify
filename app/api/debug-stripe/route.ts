import { NextResponse } from "next/server";

export async function GET() {
  const keyExists = !!process.env.STRIPE_SECRET_KEY;
  const keyPrefix = process.env.STRIPE_SECRET_KEY?.substring(0, 10) || "NOT_SET";
  const keyLength = process.env.STRIPE_SECRET_KEY?.length || 0;

  let sdkTest = "not tested";
  let fetchTest = "not tested";

  if (keyExists) {
    const key = process.env.STRIPE_SECRET_KEY!;

    // Test 1: Direct fetch to Stripe API (no SDK)
    try {
      const fetchResponse = await fetch("https://api.stripe.com/v1/balance", {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });
      const fetchData = await fetchResponse.json();
      if (fetchResponse.ok) {
        fetchTest = `OK - status ${fetchResponse.status}`;
      } else {
        fetchTest = `FAILED: ${fetchData.error?.message || "Unknown"}`;
      }
    } catch (error) {
      fetchTest = `FETCH ERROR: ${error instanceof Error ? error.message : "Unknown"}`;
    }

    // Test 2: Stripe SDK with fetch-based HTTP client
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(key, {
        typescript: true,
        httpClient: Stripe.createFetchHttpClient(),
      });

      const balance = await stripe.balance.retrieve();
      sdkTest = `OK - available: ${balance.available[0]?.amount || 0}`;
    } catch (error) {
      sdkTest = `SDK ERROR: ${error instanceof Error ? error.message : "Unknown"}`;
    }
  }

  // Check base URL config
  const nextPublicUrl = process.env.NEXT_PUBLIC_URL || "NOT_SET";
  const vercelUrl = process.env.VERCEL_URL || "NOT_SET";
  let baseUrl = "localhost";
  if (process.env.NEXT_PUBLIC_URL) {
    baseUrl = process.env.NEXT_PUBLIC_URL;
  } else if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  }

  return NextResponse.json({
    keyExists,
    keyPrefix,
    keyLength,
    fetchTest,
    sdkTest,
    nodeEnv: process.env.NODE_ENV,
    region: process.env.VERCEL_REGION || "unknown",
    nextPublicUrl,
    vercelUrl,
    baseUrl,
  });
}
