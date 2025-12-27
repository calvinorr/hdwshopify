import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type AuthResult =
  | { authorized: true; userId: string }
  | { authorized: false; error: NextResponse };

// Parse admin user IDs once at module load
const adminUserIds = (process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === "production";
const isAdminConfigured = adminUserIds.length > 0;

/**
 * Require admin authentication for API routes.
 * Returns authorized: true with userId if authenticated,
 * or authorized: false with an error response to return.
 *
 * Security behavior:
 * - Production WITHOUT ADMIN_USER_IDS: DENIED (fail closed)
 * - Production WITH ADMIN_USER_IDS: Only listed users allowed
 * - Development WITHOUT ADMIN_USER_IDS: Any authenticated user allowed
 * - Development WITH BYPASS_AUTH=true: Always allowed (dev-user)
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

  // Check admin access
  if (isAdminConfigured) {
    // Admin IDs are configured - check if user is in the list
    if (!adminUserIds.includes(userId)) {
      return {
        authorized: false,
        error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }
  } else if (isProduction) {
    // FAIL CLOSED: In production without ADMIN_USER_IDS, deny ALL access
    return {
      authorized: false,
      error: NextResponse.json(
        { error: "Admin access is not configured" },
        { status: 503 }
      ),
    };
  }
  // In development without ADMIN_USER_IDS, allow access (for convenience)

  return { authorized: true, userId };
}
