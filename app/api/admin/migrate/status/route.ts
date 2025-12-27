import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  const configured = !!(
    domain &&
    token &&
    domain.includes(".myshopify.com") &&
    token.startsWith("shpat_")
  );

  return NextResponse.json({
    configured,
    domain: configured ? domain : undefined,
  });
}
