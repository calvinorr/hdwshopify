"use client";

import Link from "next/link";
import { ArrowLeft, CreditCard, Construction } from "lucide-react";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";

export default function CheckoutPage() {
  const { items, subtotal, itemCount } = useCart();

  if (itemCount === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="font-heading text-2xl mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">
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
            <div className="text-center py-16 px-4 border border-dashed border-border rounded-lg bg-muted/20">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 mx-auto">
                <Construction className="h-10 w-10 text-amber-600" />
              </div>
              <h1 className="font-heading text-2xl md:text-3xl mb-4">
                Checkout Coming Soon
              </h1>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We&apos;re currently setting up our secure checkout system with Stripe.
                In the meantime, please contact us directly to complete your order.
              </p>

              <div className="bg-card border rounded-lg p-6 mb-6 text-left">
                <h3 className="font-medium mb-3">Your Order Summary</h3>
                <div className="space-y-2 text-sm">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {item.productName} - {item.variantName} x {item.quantity}
                      </span>
                      <span>£{((item.price * item.quantity) / 100).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                    <span>Subtotal</span>
                    <span>£{(subtotal / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link href="/contact">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Contact to Order
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/products">Continue Shopping</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
