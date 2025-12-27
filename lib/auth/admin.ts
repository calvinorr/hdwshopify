import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type AuthResult =
  | { authorized: true; userId: string }
  | { authorized: false; error: NextResponse };

/**
 * Require admin authentication for API routes.
 * Returns authorized: true with userId if authenticated,
 * or authorized: false with an error response to return.
 *
 * Usage:
 * ```ts
 * export async function GET(request: Request) {
 *   const authResult = await requireAdmin();
 *   if (!authResult.authorized) return authResult.error;
 *   // ... rest of handler
 * }
 * ```
 */
export async function requireAdmin(): Promise<AuthResult> {
  // Bypass auth in development mode if BYPASS_AUTH is set
  // Note: This is enforced to be non-production in middleware.ts
  if (
    process.env.BYPASS_AUTH === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    return { authorized: true, userId: "dev-user" };
  }

  const { userId } = await auth();

  if (!userId) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Check against admin allowlist if configured
  const adminUserIds = (process.env.ADMIN_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (adminUserIds.length > 0 && !adminUserIds.includes(userId)) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { authorized: true, userId };
}
