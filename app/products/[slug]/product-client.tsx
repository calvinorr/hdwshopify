"use client";

import { useCallback, useEffect } from "react";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductInfo } from "@/components/products/product-info";
import { AddToCart } from "@/components/products/add-to-cart";
import { useCart } from "@/contexts/cart-context";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import type { ProductWithRelations } from "@/types/product";

interface ProductClientProps {
  product: ProductWithRelations;
  availableStock: number;
}

export function ProductClient({ product, availableStock }: ProductClientProps) {
  const { addItem } = useCart();
  const { addProduct } = useRecentlyViewed();

  // Track this product as viewed
  useEffect(() => {
    // Defensive: ensure images is always an array
    const safeImages = product.images ?? [];
    const firstImage = safeImages[0];

    addProduct({
      slug: product.slug,
      name: product.name,
      image: firstImage?.url ?? null,
      price: product.price,
      category: product.category?.name,
    });
  }, [product, addProduct]);

  const handleAddToCart = useCallback(
    async (quantity: number) => {
      await addItem(product.id, quantity, {
        name: product.name,
        colorway: product.colorHex ?? undefined,
      });
    },
    [addItem, product.id, product.name, product.colorHex]
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
      {/* Gallery - Left column on desktop */}
      <div className="lg:sticky lg:top-32 lg:self-start">
        <ProductGallery images={product.images} />
      </div>

      {/* Product details - Right column on desktop */}
      <div className="space-y-8">
        <ProductInfo product={product} />

        {/* Add to Cart */}
        <div className="border-t pt-6">
          <AddToCart
            product={product}
            availableStock={availableStock}
            onAddToCart={handleAddToCart}
          />
        </div>
      </div>
    </div>
  );
}
