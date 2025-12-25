"use client";

import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";
import { Leaf } from "lucide-react";
import type { ProductWithRelations } from "@/types/product";

interface ProductGridProps {
  products: ProductWithRelations[];
  className?: string;
}

export function ProductGrid({ products, className }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
          <Leaf className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-heading text-xl font-medium text-foreground mb-2">
          No products found
        </h3>
        <p className="font-body text-muted-foreground max-w-md">
          We couldn&apos;t find any products matching your criteria. Try adjusting your
          filters or check back soon for new arrivals.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-6",
        "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        className
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
