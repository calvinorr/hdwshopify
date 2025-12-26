"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";
import { CartProvider } from "@/contexts/cart-context";

const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Only wrap with ClerkProvider if we have valid Clerk keys
const isClerkConfigured =
  clerkPubKey && clerkPubKey.startsWith("pk_") && !clerkPubKey.includes("placeholder");

export function Providers({ children }: { children: ReactNode }) {
  const content = <CartProvider>{children}</CartProvider>;

  if (isClerkConfigured) {
    return <ClerkProvider>{content}</ClerkProvider>;
  }

  return content;
}
