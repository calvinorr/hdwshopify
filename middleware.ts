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

// Define protected routes
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// Get admin user IDs from environment variable
// Format: comma-separated list of Clerk user IDs
// Example: ADMIN_USER_IDS=user_2abc123,user_2def456
const getAdminUserIds = (): string[] => {
  const ids = process.env.ADMIN_USER_IDS || "";
  return ids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
};

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

    // Logged in but not in allowlist - show forbidden
    const adminUserIds = getAdminUserIds();

    // If no admins configured, allow access (development mode)
    if (adminUserIds.length > 0 && !adminUserIds.includes(userId)) {
      return new NextResponse("Forbidden - You don't have access to the admin area", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }
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
