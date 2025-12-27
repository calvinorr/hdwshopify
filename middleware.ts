import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Check if auth bypass is enabled (for development only)
const isBypassEnabled =
  process.env.BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";

// Critical safety check - log error if BYPASS_AUTH is set in production
if (process.env.NODE_ENV === "production" && process.env.BYPASS_AUTH === "true") {
  console.error(
    "CRITICAL SECURITY WARNING: BYPASS_AUTH is enabled in production! This setting is being ignored."
  );
}

// Check if ADMIN_USER_IDS is configured
const adminUserIds = (process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === "production";
const isAdminConfigured = adminUserIds.length > 0;

// Log warning on startup if ADMIN_USER_IDS is missing
if (!isAdminConfigured) {
  if (isProduction) {
    console.error(
      "CRITICAL SECURITY WARNING: ADMIN_USER_IDS is not configured in production! " +
      "Admin access will be DENIED to all users. Set ADMIN_USER_IDS to enable admin access."
    );
  } else {
    console.warn(
      "WARNING: ADMIN_USER_IDS is not configured. " +
      "In development, any authenticated user can access admin. " +
      "In production, admin access would be denied."
    );
  }
}

// Define protected routes
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// Bypass middleware - just pass through
function bypassMiddleware(req: NextRequest) {
  return NextResponse.next();
}

// Full Clerk middleware with auth checks
const authMiddleware = clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Admin routes require authentication AND allowlist check
  if (isAdminRoute(req)) {
    // Not logged in - redirect to sign in
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Check admin access
    if (isAdminConfigured) {
      // Admin IDs are configured - check if user is in the list
      if (!adminUserIds.includes(userId)) {
        return new NextResponse("Forbidden - You don't have access to the admin area", {
          status: 403,
          headers: { "Content-Type": "text/plain" },
        });
      }
    } else if (isProduction) {
      // FAIL CLOSED: In production without ADMIN_USER_IDS, deny ALL access
      return new NextResponse(
        "Admin access is not configured. Contact the site administrator.",
        { status: 503, headers: { "Content-Type": "text/plain" } }
      );
    }
    // In development without ADMIN_USER_IDS, allow access (for convenience)
  }

  return NextResponse.next();
});

// Export the appropriate middleware based on bypass setting
export default isBypassEnabled ? bypassMiddleware : authMiddleware;

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
