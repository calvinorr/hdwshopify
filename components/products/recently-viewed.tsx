"use client";

import * as React from "react";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { ProductCard } from "./product-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductWithRelations } from "@/types/product";

interface RecentlyViewedProps {
  currentSlug?: string;
  maxItems?: number;
}

export function RecentlyViewed({
  currentSlug,
  maxItems = 4,
}: RecentlyViewedProps) {
  const { items, isLoaded } = useRecentlyViewed();
  const [products, setProducts] = React.useState<ProductWithRelations[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Filter out current product and limit to maxItems
  const slugsToFetch = React.useMemo(() => {
    return items
      .filter((item) => item.slug !== currentSlug)
      .slice(0, maxItems)
      .map((item) => item.slug);
  }, [items, currentSlug, maxItems]);

  // Fetch full product data for recently viewed slugs
  React.useEffect(() => {
    if (!isLoaded) return;

    if (slugsToFetch.length === 0) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/products/recently-viewed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slugs: slugsToFetch }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        // Sort products to match the order in slugsToFetch
        const sortedProducts = slugsToFetch
          .map((slug) =>
            data.products.find((p: ProductWithRelations) => p.slug === slug)
          )
          .filter(Boolean) as ProductWithRelations[];

        setProducts(sortedProducts);
      } catch (error) {
        console.warn("Failed to fetch recently viewed products:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [slugsToFetch, isLoaded]);

  // Don't render anything if no history or still loading initial state
  if (!isLoaded || (isLoaded && slugsToFetch.length === 0)) {
    return null;
  }

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <h2 className="font-heading text-xl font-medium text-foreground mb-6">
        Recently Viewed
      </h2>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: Math.min(slugsToFetch.length, maxItems) }).map(
            (_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            )
          )}
        </div>
      ) : products.length > 0 ? (
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
      ) : null}
    </section>
  );
}
