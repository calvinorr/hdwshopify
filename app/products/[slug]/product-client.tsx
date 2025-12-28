"use client";

import { useState, useCallback, useEffect } from "react";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductInfo } from "@/components/products/product-info";
import { VariantSelector } from "@/components/products/variant-selector";
import { AddToCart } from "@/components/products/add-to-cart";
import { useCart } from "@/contexts/cart-context";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import type { ProductWithRelations } from "@/types/product";

interface ProductClientProps {
  product: ProductWithRelations;
  availableStock: Record<number, number>;
}

export function ProductClient({ product, availableStock }: ProductClientProps) {
  const { addItem } = useCart();
  const { addProduct } = useRecentlyViewed();

  // Track this product as viewed
  useEffect(() => {
    const firstImage = product.images[0];
    const lowestPrice = product.variants.length
      ? Math.min(...product.variants.map((v) => v.price))
      : product.basePrice;

    addProduct({
      slug: product.slug,
      name: product.name,
      image: firstImage?.url ?? null,
      price: lowestPrice,
      category: product.category?.name,
    });
  }, [product, addProduct]);

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
      const variant = product.variants.find((v) => v.id === variantId);
      await addItem(variantId, quantity, {
        name: product.name,
        variant: variant?.name ?? "Default",
      });
    },
    [addItem, product.name, product.variants]
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

            <AddToCart
              variant={selectedVariant}
              availableStock={selectedVariantId ? availableStock[selectedVariantId] : 0}
              onAddToCart={handleAddToCart}
            />
          </div>
        )}
      </div>
    </div>
  );
}
