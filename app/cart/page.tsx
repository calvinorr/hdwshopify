"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CartItem } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { useCart } from "@/contexts/cart-context";

function CartSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="flex gap-4 py-6 border-b border-border/50">
          <Skeleton className="h-24 w-24 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="font-heading text-xl font-medium text-foreground mb-2">
        Your cart is empty
      </h2>
      <p className="font-body text-muted-foreground mb-6 max-w-md">
        Looks like you haven&apos;t added any yarns to your cart yet.
        Explore our collection of naturally dyed yarns and find your perfect skein.
      </p>
      <Button asChild>
        <Link href="/products">
          Continue Shopping
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

export default function CartPage() {
  const { items, subtotal, itemCount, isLoading, updateQuantity, removeItem } = useCart();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <h1 className="font-heading text-3xl md:text-4xl font-medium text-foreground mb-8">
            Shopping Cart
          </h1>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <CartSkeleton />
              </div>
              <div>
                <Skeleton className="h-80 rounded-lg" />
              </div>
            </div>
          ) : items.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart items */}
              <div className="lg:col-span-2">
                <div className="divide-y divide-border/50">
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <Link
                    href="/products"
                    className="font-body text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    Continue Shopping
                  </Link>
                </div>
              </div>

              {/* Summary sidebar */}
              <div className="lg:sticky lg:top-24 lg:self-start">
                <CartSummary
                  subtotal={subtotal}
                  itemCount={itemCount}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
