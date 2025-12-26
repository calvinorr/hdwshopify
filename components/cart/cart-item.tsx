"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem as CartItemType } from "@/contexts/cart-context";
import { cn } from "@/lib/utils";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  disabled?: boolean;
}

export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  disabled,
}: CartItemProps) {
  const lineTotal = item.price * item.quantity;

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (item.quantity < item.stock) {
      onUpdateQuantity(item.id, item.quantity + 1);
    }
  };

  return (
    <div className="flex gap-4 py-6 border-b border-border/50">
      {/* Image */}
      <Link
        href={`/products/${item.productSlug}`}
        className="shrink-0 overflow-hidden rounded-lg bg-secondary"
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={`${item.productName} - ${item.variantName}`}
            width={100}
            height={100}
            className="h-24 w-24 object-cover transition-transform hover:scale-105"
          />
        ) : (
          <div className="h-24 w-24 flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between gap-4">
          <div>
            <Link
              href={`/products/${item.productSlug}`}
              className="font-heading text-base font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {item.productName}
            </Link>
            <p className="font-body text-sm text-muted-foreground mt-0.5">
              {item.variantName}
            </p>
            <p className="font-body text-sm text-foreground mt-1">
              £{item.price.toFixed(2)}
            </p>
          </div>

          {/* Line total - desktop */}
          <p className="hidden sm:block font-heading text-base font-medium text-foreground">
            £{lineTotal.toFixed(2)}
          </p>
        </div>

        {/* Quantity controls */}
        <div className="flex items-center justify-between mt-auto pt-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none"
                onClick={handleDecrement}
                disabled={disabled || item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
                <span className="sr-only">Decrease quantity</span>
              </Button>
              <span className="w-10 text-center font-body text-sm">
                {item.quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none"
                onClick={handleIncrement}
                disabled={disabled || item.quantity >= item.stock}
              >
                <Plus className="h-3 w-3" />
                <span className="sr-only">Increase quantity</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 text-muted-foreground hover:text-destructive",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => onRemove(item.id)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remove item</span>
            </Button>
          </div>

          {/* Line total - mobile */}
          <p className="sm:hidden font-heading text-base font-medium text-foreground">
            £{lineTotal.toFixed(2)}
          </p>
        </div>

        {/* Stock warning */}
        {item.quantity >= item.stock && (
          <p className="font-body text-xs text-amber-600 mt-2">
            Only {item.stock} left in stock
          </p>
        )}
      </div>
    </div>
  );
}
