"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Only wrap with ClerkProvider if we have valid Clerk keys
const isClerkConfigured =
  clerkPubKey && clerkPubKey.startsWith("pk_") && !clerkPubKey.includes("placeholder");

export function Providers({ children }: { children: ReactNode }) {
  if (isClerkConfigured) {
    return <ClerkProvider>{children}</ClerkProvider>;
  }

  // Return children without Clerk if not configured
  return <>{children}</>;
}
