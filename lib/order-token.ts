import crypto from "crypto";

const ORDER_TOKEN_SECRET = process.env.ORDER_TOKEN_SECRET || "fallback-secret-change-in-production";

/**
 * Generate a secure token for guest order tracking.
 * Token format: base64url(orderId:email:timestamp:signature)
 */
export function generateOrderToken(orderId: number, email: string): string {
  const timestamp = Date.now();
  const payload = `${orderId}:${email.toLowerCase()}:${timestamp}`;
  const signature = crypto
    .createHmac("sha256", ORDER_TOKEN_SECRET)
    .update(payload)
    .digest("hex")
    .substring(0, 32);

  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

/**
 * Verify and decode an order tracking token.
 * Returns null if invalid or expired (30 days).
 */
export function verifyOrderToken(token: string): {
  orderId: number;
  email: string;
} | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");

    if (parts.length !== 4) return null;

    const [orderIdStr, email, timestampStr, signature] = parts;
    const orderId = parseInt(orderIdStr, 10);
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(orderId) || isNaN(timestamp)) return null;

    // Check expiry (30 days)
    const age = Date.now() - timestamp;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (age > thirtyDays) return null;

    // Verify signature
    const payload = `${orderId}:${email}:${timestamp}`;
    const expectedSig = crypto
      .createHmac("sha256", ORDER_TOKEN_SECRET)
      .update(payload)
      .digest("hex")
      .substring(0, 32);

    if (signature !== expectedSig) return null;

    return { orderId, email };
  } catch {
    return null;
  }
}

/**
 * Generate a tracking URL for an order.
 */
export function generateOrderTrackingUrl(
  orderId: number,
  email: string,
  orderNumber: string
): string {
  const token = generateOrderToken(orderId, email);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://herbarium-dyeworks.warmwetcircles.com";
  return `${baseUrl}/order/${orderNumber}?token=${token}`;
}
