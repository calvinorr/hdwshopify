"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  isLoading?: boolean;
}

export function CartSummary({ subtotal, itemCount, isLoading }: CartSummaryProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="font-heading text-lg font-medium text-foreground mb-4">
        Order Summary
      </h2>

      <div className="space-y-3">
        <div className="flex justify-between font-body text-sm">
          <span className="text-muted-foreground">
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
          <span className="text-foreground">£{subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between font-body text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-muted-foreground italic">
            Calculated at checkout
          </span>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex justify-between font-heading text-lg font-medium">
        <span className="text-foreground">Total</span>
        <span className="text-foreground">£{subtotal.toFixed(2)}</span>
      </div>

      <p className="font-body text-xs text-muted-foreground mt-2 mb-4">
        Taxes included. Shipping calculated at checkout.
      </p>

      <Button
        className="w-full"
        size="lg"
        disabled={isLoading || itemCount === 0}
        asChild
      >
        <Link href="/checkout">
          Proceed to Checkout
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>

      <div className="mt-4 text-center">
        <Link
          href="/products"
          className="font-body text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          or continue shopping
        </Link>
      </div>

      {/* Free shipping notice */}
      {subtotal > 0 && subtotal < 50 && (
        <div className="mt-4 p-3 rounded-md bg-secondary/50 text-center">
          <p className="font-body text-xs text-muted-foreground">
            Add <span className="font-medium text-foreground">£{(50 - subtotal).toFixed(2)}</span> more for free UK shipping
          </p>
        </div>
      )}

      {subtotal >= 50 && (
        <div className="mt-4 p-3 rounded-md bg-green-50 dark:bg-green-950/20 text-center">
          <p className="font-body text-xs text-green-700 dark:text-green-400">
            You qualify for free UK shipping!
          </p>
        </div>
      )}
    </div>
  );
}
