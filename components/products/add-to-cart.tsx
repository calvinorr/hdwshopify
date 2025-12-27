"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/types/product";

interface AddToCartProps {
  variant: ProductVariant | null;
  availableStock?: number;
  onAddToCart: (variantId: number, quantity: number) => Promise<void> | void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(price);
}

export function AddToCart({ variant, availableStock, onAddToCart }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Use availableStock (accounts for reservations) when provided, otherwise fall back to variant.stock
  const stock = availableStock ?? variant?.stock ?? 0;
  const isOutOfStock = stock === 0;
  const maxQuantity = Math.min(stock, 10); // Cap at 10 or available stock

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const incrementQuantity = () => {
    setQuantity((prev) => Math.min(maxQuantity, prev + 1));
  };

  const handleAddToCart = async () => {
    if (!variant || isOutOfStock) return;

    setIsLoading(true);
    try {
      await onAddToCart(variant.id, quantity);
      setQuantity(1); // Reset quantity after adding
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Price Display */}
      {variant && (
        <div className="flex items-baseline gap-3">
          <span className="font-heading text-2xl text-foreground sm:text-3xl">
            {formatPrice(variant.price)}
          </span>
          {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
            <span className="font-body text-lg text-muted-foreground line-through">
              {formatPrice(variant.compareAtPrice)}
            </span>
          )}
        </div>
      )}

      {/* Quantity Selector and Add to Cart */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Quantity Selector */}
        <div
          className={cn(
            "flex h-11 w-fit items-center rounded-lg border border-border bg-background",
            isOutOfStock && "opacity-50"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-l-lg rounded-r-none border-r hover:bg-secondary"
            onClick={decrementQuantity}
            disabled={quantity <= 1 || isOutOfStock || !variant}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="flex h-11 w-14 items-center justify-center">
            <span className="font-body text-base font-medium">{quantity}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-l-none rounded-r-lg border-l hover:bg-secondary"
            onClick={incrementQuantity}
            disabled={quantity >= maxQuantity || isOutOfStock || !variant}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Add to Cart Button */}
        <Button
          size="lg"
          className={cn(
            "h-11 flex-1 gap-2 font-body sm:flex-initial sm:min-w-[200px]",
            isOutOfStock && "bg-muted text-muted-foreground hover:bg-muted"
          )}
          onClick={handleAddToCart}
          disabled={isOutOfStock || !variant || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : isOutOfStock ? (
            "Sold Out"
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              Add to Cart
            </>
          )}
        </Button>
      </div>

      {/* Low Stock Warning */}
      {!isOutOfStock && stock <= 5 && variant && (
        <p className="text-sm font-body text-amber-700">
          Only {stock} left in stock - order soon
        </p>
      )}

      {/* Total when quantity > 1 */}
      {quantity > 1 && variant && !isOutOfStock && (
        <p className="text-sm font-body text-muted-foreground">
          Total: {formatPrice(variant.price * quantity)} for {quantity} skeins
        </p>
      )}
    </div>
  );
}
