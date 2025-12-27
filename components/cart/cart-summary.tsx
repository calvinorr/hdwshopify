"use client";

import Link from "next/link";
import { ArrowRight, Truck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const FREE_SHIPPING_THRESHOLD = 50;

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  isLoading?: boolean;
}

function FreeShippingProgress({ subtotal }: { subtotal: number }) {
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountRemaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
  const qualifies = subtotal >= FREE_SHIPPING_THRESHOLD;

  if (subtotal === 0) return null;

  return (
    <div className={cn(
      "p-4 rounded-lg",
      qualifies ? "bg-green-50 dark:bg-green-950/30" : "bg-secondary/50"
    )}>
      <div className="flex items-center gap-2 mb-2">
        {qualifies ? (
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500">
            <Check className="w-3 h-3 text-white" />
          </div>
        ) : (
          <Truck className="w-5 h-5 text-muted-foreground" />
        )}
        <span className={cn(
          "font-body text-sm font-medium",
          qualifies ? "text-green-700 dark:text-green-400" : "text-foreground"
        )}>
          {qualifies
            ? "You qualify for free UK shipping!"
            : `£${amountRemaining.toFixed(2)} away from free UK shipping`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            qualifies ? "bg-green-500" : "bg-primary"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {!qualifies && (
        <p className="font-body text-xs text-muted-foreground mt-2">
          Free standard shipping on UK orders over £{FREE_SHIPPING_THRESHOLD}
        </p>
      )}
    </div>
  );
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

      {/* Free shipping progress bar */}
      <div className="mt-4">
        <FreeShippingProgress subtotal={subtotal} />
      </div>
    </div>
  );
}
