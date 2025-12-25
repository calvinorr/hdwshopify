"use client";

import { useState, useCallback } from "react";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductInfo } from "@/components/products/product-info";
import { VariantSelector } from "@/components/products/variant-selector";
import { AddToCart } from "@/components/products/add-to-cart";
import type { ProductWithRelations } from "@/types/product";

interface ProductClientProps {
  product: ProductWithRelations;
}

export function ProductClient({ product }: ProductClientProps) {
  // Default to first variant if available
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    product.variants[0]?.id ?? null
  );

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? null;

  const handleVariantChange = useCallback((variantId: number) => {
    setSelectedVariantId(variantId);
  }, []);

  const handleAddToCart = useCallback(
    async (variantId: number, quantity: number) => {
      // TODO: Implement cart functionality
      // This will call the cart API to add the item
      console.log("Adding to cart:", { variantId, quantity });

      // Placeholder for cart API call
      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            variantId,
            quantity,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to add to cart");
        }

        // TODO: Show success toast or update cart count
      } catch (error) {
        console.error("Error adding to cart:", error);
        // TODO: Show error toast
      }
    },
    []
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

        {/* Variant Selection */}
        {product.variants.length > 0 && (
          <div className="space-y-6 border-t pt-6">
            <VariantSelector
              variants={product.variants}
              selectedVariantId={selectedVariantId}
              onVariantChange={handleVariantChange}
            />

            <AddToCart variant={selectedVariant} onAddToCart={handleAddToCart} />
          </div>
        )}
      </div>
    </div>
  );
}
