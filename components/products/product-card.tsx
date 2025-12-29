"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { toast } from "sonner";
import type { ProductWithRelations } from "@/types/product";

interface ProductCardProps {
  product: ProductWithRelations;
  className?: string;
}

function getStockStatus(stock: number | null) {
  const totalStock = stock ?? 0;

  if (totalStock === 0) {
    return { label: "Sold Out", status: "sold-out" as const };
  }

  if (totalStock <= 3) {
    return { label: "Low Stock", status: "low-stock" as const };
  }

  return { label: "In Stock", status: "in-stock" as const };
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const { addItem } = useCart();

  const stockInfo = getStockStatus(product.stock);
  const isSoldOut = stockInfo.status === "sold-out";

  // Get primary and secondary images (sorted by position)
  const sortedImages = [...product.images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const primaryImage = sortedImages[0];
  const secondaryImage = sortedImages[1];

  const stockBadgeClasses = {
    "in-stock": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "low-stock": "bg-amber-100 text-amber-800 border-amber-200",
    "sold-out": "bg-red-100 text-red-800 border-red-200",
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSoldOut || isAdding) return;

    setIsAdding(true);
    try {
      const success = await addItem(product.id, 1, {
        name: product.name,
        colorway: product.colorHex ?? undefined,
      });

      if (success) {
        toast.success("Added to cart", {
          description: product.name,
        });
      }
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group block rounded-lg overflow-hidden bg-card transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/5",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-secondary/30">
        {primaryImage ? (
          <>
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "object-cover transition-all duration-500",
                isHovered && secondaryImage ? "opacity-0 scale-105" : "opacity-100 scale-100"
              )}
            />
            {secondaryImage && (
              <Image
                src={secondaryImage.url}
                alt={secondaryImage.alt || `${product.name} - alternate view`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={cn(
                  "object-cover transition-all duration-500 absolute inset-0",
                  isHovered ? "opacity-100 scale-100" : "opacity-0 scale-95"
                )}
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
            <span className="text-muted-foreground font-body text-sm">No image</span>
          </div>
        )}

        {/* Stock Badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="outline"
            className={cn(
              "font-body text-xs font-medium backdrop-blur-sm",
              stockBadgeClasses[stockInfo.status]
            )}
          >
            {stockInfo.label}
          </Badge>
        </div>

        {/* Featured Badge */}
        {product.featured && (
          <div className="absolute top-3 right-3">
            <Badge className="font-body text-xs bg-primary/90 backdrop-blur-sm">
              Featured
            </Badge>
          </div>
        )}

        {/* Quick Add Button */}
        {!isSoldOut && (
          <div
            className={cn(
              "absolute bottom-3 right-3 transition-all duration-200",
              // Desktop: show on hover/focus
              "md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0",
              "md:group-focus-within:opacity-100 md:group-focus-within:translate-y-0",
              // Mobile: always visible (smaller)
              "opacity-100 translate-y-0"
            )}
          >
            <Button
              size="icon"
              variant="secondary"
              className={cn(
                "h-9 w-9 md:h-10 md:w-10 rounded-full shadow-md",
                "bg-white/90 hover:bg-white text-foreground",
                "backdrop-blur-sm"
              )}
              onClick={handleQuickAdd}
              disabled={isAdding}
              aria-label={`Add ${product.name} to cart`}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Category */}
        {product.category && (
          <span className="font-body text-xs text-muted-foreground uppercase tracking-wide">
            {product.category.name}
          </span>
        )}

        {/* Name */}
        <h3 className="font-heading text-lg font-medium text-foreground leading-tight group-hover:text-primary transition-colors duration-200">
          {product.name}
        </h3>

        {/* Yarn Info */}
        <div className="flex flex-wrap gap-2">
          {product.weight && (
            <span className="font-body text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
              {product.weight}
            </span>
          )}
          {product.fiberContent && (
            <span className="font-body text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
              {product.fiberContent}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="pt-2">
          <span className="font-heading text-xl font-medium text-foreground">
            £{product.price.toFixed(2)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="ml-2 font-body text-sm text-muted-foreground line-through">
              £{product.compareAtPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
