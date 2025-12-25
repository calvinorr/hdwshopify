"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ProductWithRelations } from "@/types/product";

interface ProductCardProps {
  product: ProductWithRelations;
  className?: string;
}

function getStockStatus(variants: ProductWithRelations["variants"]) {
  const totalStock = variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);

  if (totalStock === 0) {
    return { label: "Sold Out", status: "sold-out" as const };
  }

  if (totalStock <= 3) {
    return { label: "Low Stock", status: "low-stock" as const };
  }

  return { label: "In Stock", status: "in-stock" as const };
}

function getPriceDisplay(variants: ProductWithRelations["variants"], basePrice: number) {
  if (variants.length === 0) {
    return { display: `£${basePrice.toFixed(2)}`, hasRange: false };
  }

  const prices = variants.map((v) => v.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) {
    return { display: `£${minPrice.toFixed(2)}`, hasRange: false };
  }

  return {
    display: `From £${minPrice.toFixed(2)}`,
    hasRange: true,
  };
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const stockInfo = getStockStatus(product.variants);
  const priceInfo = getPriceDisplay(product.variants, product.basePrice);

  // Get primary and secondary images (sorted by position)
  const sortedImages = [...product.images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const primaryImage = sortedImages[0];
  const secondaryImage = sortedImages[1];

  const stockBadgeClasses = {
    "in-stock": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "low-stock": "bg-amber-100 text-amber-800 border-amber-200",
    "sold-out": "bg-red-100 text-red-800 border-red-200",
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
            {priceInfo.display}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
            <span className="ml-2 font-body text-sm text-muted-foreground line-through">
              £{product.compareAtPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
