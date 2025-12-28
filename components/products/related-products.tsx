"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "./product-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductWithRelations } from "@/types/product";

interface RelatedProductsProps {
  currentSlug: string;
}

export function RelatedProducts({ currentSlug }: RelatedProductsProps) {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRelatedProducts() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/products/${currentSlug}/related`);

        if (!response.ok) {
          throw new Error("Failed to fetch related products");
        }

        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error("Error fetching related products:", err);
        setError("Could not load related products");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRelatedProducts();
  }, [currentSlug]);

  // Don't render section if no products and not loading
  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-12 border-t border-border">
      <h2 className="font-heading text-2xl font-medium mb-8">
        You may also like
      </h2>

      {error ? (
        <p className="text-muted-foreground font-body">{error}</p>
      ) : isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* Mobile: Horizontal scroll */}
          <div className="md:hidden -mx-4 px-4">
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-[70vw] snap-start"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid md:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden bg-card">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-24 mt-2" />
      </div>
    </div>
  );
}
