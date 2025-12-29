"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, X, Minus, Plus, Trash2, Truck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/contexts/cart-context";
import { cn } from "@/lib/utils";

interface CartDrawerProps {
  isTransparent?: boolean;
}

const FREE_SHIPPING_THRESHOLD = 50;

function CompactFreeShippingBar({ subtotal }: { subtotal: number }) {
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountRemaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
  const qualifies = subtotal >= FREE_SHIPPING_THRESHOLD;

  if (subtotal === 0) return null;

  return (
    <div className={cn(
      "p-3 rounded-lg mb-4",
      qualifies ? "bg-green-50 dark:bg-green-950/30" : "bg-secondary/50"
    )}>
      <div className="flex items-center gap-2 mb-1.5">
        {qualifies ? (
          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-green-500">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        ) : (
          <Truck className="w-4 h-4 text-muted-foreground" />
        )}
        <span className={cn(
          "font-body text-xs font-medium",
          qualifies ? "text-green-700 dark:text-green-400" : "text-foreground"
        )}>
          {qualifies
            ? "Free UK shipping!"
            : `£${amountRemaining.toFixed(2)} to free shipping`}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            qualifies ? "bg-green-500" : "bg-primary"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function CartDrawer({ isTransparent }: CartDrawerProps) {
  const { items, itemCount, subtotal, updateQuantity, removeItem, isLoading } =
    useCart();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative shrink-0 transition-colors",
            isTransparent && "text-white hover:bg-white/10"
          )}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="sr-only">Cart ({itemCount} items)</span>
          {itemCount > 0 && (
            <span
              className={cn(
                "absolute -top-1 -right-1 h-4 w-4 rounded-full text-[10px] font-medium flex items-center justify-center",
                isTransparent
                  ? "bg-white text-stone-900"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="space-y-0 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-heading text-xl">
              Cart ({itemCount})
            </SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="-mr-2">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              Loading...
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-heading text-lg font-medium text-foreground mb-1">
              Your cart is empty
            </p>
            <p className="font-body text-sm text-muted-foreground mb-4">
              Add some yarns to get started
            </p>
            <SheetClose asChild>
              <Button asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    {/* Image */}
                    <Link
                      href={`/products/${item.productSlug}`}
                      onClick={() => setOpen(false)}
                      className="shrink-0 overflow-hidden rounded-md bg-secondary"
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={`${item.productName} - ${item.colorway}`}
                          width={80}
                          height={80}
                          className="h-20 w-20 object-cover"
                        />
                      ) : (
                        <div className="h-20 w-20 flex items-center justify-center text-muted-foreground text-xs">
                          No image
                        </div>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.productSlug}`}
                        onClick={() => setOpen(false)}
                        className="font-heading text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {item.productName}
                      </Link>
                      <p className="font-body text-xs text-muted-foreground mt-0.5">
                        {item.colorway}
                      </p>
                      <p className="font-body text-sm text-foreground mt-1">
                        £{item.price.toFixed(2)}
                      </p>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-border rounded">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-none"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center font-body text-xs">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-none"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Line total */}
                    <p className="font-heading text-sm font-medium text-foreground shrink-0">
                      £{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="pt-4 mt-auto">
              <Separator className="mb-4" />

              <div className="flex justify-between mb-2">
                <span className="font-body text-sm text-muted-foreground">
                  Subtotal
                </span>
                <span className="font-heading text-base font-medium">
                  £{subtotal.toFixed(2)}
                </span>
              </div>

              <p className="font-body text-xs text-muted-foreground mb-4">
                Shipping calculated at checkout
              </p>

              <CompactFreeShippingBar subtotal={subtotal} />

              <div className="space-y-2">
                <SheetClose asChild>
                  <Button className="w-full" size="lg" asChild>
                    <Link href="/checkout">Checkout</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    asChild
                  >
                    <Link href="/cart">View Cart</Link>
                  </Button>
                </SheetClose>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
