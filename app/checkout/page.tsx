"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Tag, X } from "lucide-react";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/cart-context";
import { formatPrice } from "@/lib/stripe";

export default function CheckoutPage() {
  const { items, subtotal, itemCount, isLoading: cartLoading } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: "percentage" | "fixed";
    value: number;
    amount: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;

    setIsValidatingDiscount(true);
    setDiscountError(null);

    try {
      const response = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode, subtotal }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDiscountError(data.error || "Invalid discount code");
        return;
      }

      setAppliedDiscount({
        code: data.code,
        type: data.type,
        value: data.value,
        amount: data.amount,
      });
      setDiscountCode("");
    } catch {
      setDiscountError("Failed to validate discount code");
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountError(null);
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discountCode: appliedDiscount?.code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to start checkout");
        setIsProcessing(false);
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Failed to get checkout URL");
        setIsProcessing(false);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="font-heading text-2xl mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground font-body mb-6">
              Add some items to your cart before checking out.
            </p>
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const discountAmount = appliedDiscount?.amount ?? 0;
  const estimatedTotal = subtotal - discountAmount;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to cart
          </Link>

          <div className="max-w-2xl mx-auto">
            <h1 className="font-heading text-2xl md:text-3xl mb-8">Checkout</h1>

            {/* Order Summary */}
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h2 className="font-heading text-lg mb-4">Order Summary</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-body">{item.productName}</p>
                      {item.variantName && item.variantName !== item.productName && (
                        <p className="text-sm text-muted-foreground font-body">
                          {item.variantName}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground font-body">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-body">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border mt-4 pt-4 space-y-2">
                <div className="flex justify-between font-body text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between font-body text-sm text-green-600">
                    <span className="flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      {appliedDiscount.code}
                      {appliedDiscount.type === "percentage"
                        ? ` (-${appliedDiscount.value}%)`
                        : ""}
                    </span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-body text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span>Calculated at next step</span>
                </div>
                <div className="flex justify-between font-heading text-lg pt-2 border-t border-border">
                  <span>Estimated Total</span>
                  <span>{formatPrice(estimatedTotal)}</span>
                </div>
              </div>
            </div>

            {/* Discount Code */}
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h2 className="font-heading text-lg mb-4">Discount Code</h2>
              {appliedDiscount ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-green-600" />
                    <span className="font-body text-green-800">
                      {appliedDiscount.code} applied
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveDiscount}
                    className="text-green-600 hover:text-green-800"
                    aria-label="Remove discount"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter discount code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyDiscount()}
                    className="font-body"
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyDiscount}
                    disabled={isValidatingDiscount || !discountCode.trim()}
                  >
                    {isValidatingDiscount ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
              )}
              {discountError && (
                <p className="text-sm text-destructive mt-2 font-body">
                  {discountError}
                </p>
              )}
            </div>

            {/* Checkout Info */}
            <div className="bg-secondary/30 border border-border rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground font-body">
                You&apos;ll be redirected to our secure payment provider (Stripe) to
                complete your purchase. Shipping costs will be calculated based on
                your delivery address.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 mb-6">
                <p className="font-body text-sm">{error}</p>
              </div>
            )}

            {/* Checkout Button */}
            <Button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full h-12 text-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Redirecting to payment...
                </>
              ) : (
                `Proceed to Payment • ${formatPrice(estimatedTotal)}`
              )}
            </Button>

            {/* Security Note */}
            <p className="text-center text-xs text-muted-foreground mt-4 font-body">
              Secure checkout powered by Stripe. Your payment details are never
              stored on our servers.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
