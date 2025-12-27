"use client";

import Link from "next/link";
import { User, Package, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Check if dev bypass is enabled
const isBypassEnabled = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

// Check if Clerk is properly configured (not placeholder keys)
const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured =
  clerkPubKey &&
  clerkPubKey.startsWith("pk_") &&
  !clerkPubKey.includes("placeholder");

interface UserMenuProps {
  isTransparent?: boolean;
  isMobile?: boolean;
  onMobileClose?: () => void;
}

// Dev user menu component
function DevUserMenu({
  isTransparent,
  isMobile,
}: {
  isTransparent: boolean;
  isMobile: boolean;
}) {
  if (isMobile) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 py-2">
          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-xs font-medium text-amber-800">DEV</span>
          </div>
          <span className="text-sm font-body text-muted-foreground">
            Dev Mode
          </span>
        </div>
        <Link
          href="/admin"
          className="block py-1 text-sm font-body text-muted-foreground hover:text-primary transition-colors pl-11"
        >
          Admin Dashboard
        </Link>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "shrink-0 transition-colors",
            isTransparent && "text-white hover:bg-white/10"
          )}
        >
          <div
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center",
              isTransparent ? "bg-white/20" : "bg-amber-100"
            )}
          >
            <span
              className={cn(
                "text-xs font-medium",
                isTransparent ? "text-white" : "text-amber-800"
              )}
            >
              DEV
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-medium">Dev Mode</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin" className="w-full cursor-pointer">
            Admin Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/products" className="w-full cursor-pointer">
            Products
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/orders" className="w-full cursor-pointer">
            Orders
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UserMenu({
  isTransparent = false,
  isMobile = false,
  onMobileClose,
}: UserMenuProps) {
  // State to hold dynamically loaded Clerk components
  const [clerkComponents, setClerkComponents] = useState<{
    SignedIn: React.ComponentType<{ children: React.ReactNode }>;
    SignedOut: React.ComponentType<{ children: React.ReactNode }>;
    UserButton: React.ComponentType<{ appearance?: object }>;
  } | null>(null);

  // Load Clerk components on mount (client-side only)
  useEffect(() => {
    if (isClerkConfigured && !isBypassEnabled) {
      import("@clerk/nextjs").then((clerk) => {
        setClerkComponents({
          SignedIn: clerk.SignedIn,
          SignedOut: clerk.SignedOut,
          UserButton: clerk.UserButton,
        });
      });
    }
  }, []);

  // Dev bypass mode - show dev user menu
  if (isBypassEnabled) {
    return <DevUserMenu isTransparent={isTransparent} isMobile={isMobile} />;
  }

  // If Clerk isn't configured or components not loaded yet, show sign in link
  if (!isClerkConfigured || !clerkComponents) {
    if (isMobile) {
      return (
        <Link
          href="/sign-in"
          className="flex items-center gap-3 py-2 text-sm font-body text-muted-foreground hover:text-primary transition-colors"
          onClick={onMobileClose}
        >
          <User className="h-5 w-5" />
          Sign In
        </Link>
      );
    }

    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "shrink-0 transition-colors",
          isTransparent && "text-white hover:bg-white/10"
        )}
        asChild
      >
        <Link href="/sign-in">
          <User className="h-5 w-5" />
          <span className="sr-only">Sign in</span>
        </Link>
      </Button>
    );
  }

  const { SignedIn, SignedOut, UserButton } = clerkComponents;

  // Clerk is configured - render full auth components
  if (isMobile) {
    return (
      <>
        <SignedIn>
          <div className="space-y-2">
            <div className="flex items-center gap-3 py-2">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
              <span className="text-sm font-body text-muted-foreground">
                Account
              </span>
            </div>
            <Link
              href="/account"
              className="flex items-center gap-3 py-1 text-sm font-body text-muted-foreground hover:text-primary transition-colors pl-11"
              onClick={onMobileClose}
            >
              <User className="h-4 w-4" />
              My Account
            </Link>
            <Link
              href="/account/orders"
              className="flex items-center gap-3 py-1 text-sm font-body text-muted-foreground hover:text-primary transition-colors pl-11"
              onClick={onMobileClose}
            >
              <Package className="h-4 w-4" />
              Orders
            </Link>
            <Link
              href="/account/addresses"
              className="flex items-center gap-3 py-1 text-sm font-body text-muted-foreground hover:text-primary transition-colors pl-11"
              onClick={onMobileClose}
            >
              <MapPin className="h-4 w-4" />
              Addresses
            </Link>
          </div>
        </SignedIn>
        <SignedOut>
          <Link
            href="/sign-in"
            className="flex items-center gap-3 py-2 text-sm font-body text-muted-foreground hover:text-primary transition-colors"
            onClick={onMobileClose}
          >
            <User className="h-5 w-5" />
            Sign In
          </Link>
        </SignedOut>
      </>
    );
  }

  return (
    <>
      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              avatarBox: cn(
                "h-8 w-8",
                isTransparent && "ring-2 ring-white/30"
              ),
            },
          }}
        />
      </SignedIn>
      <SignedOut>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "shrink-0 transition-colors",
            isTransparent && "text-white hover:bg-white/10"
          )}
          asChild
        >
          <Link href="/sign-in">
            <User className="h-5 w-5" />
            <span className="sr-only">Sign in</span>
          </Link>
        </Button>
      </SignedOut>
    </>
  );
}
