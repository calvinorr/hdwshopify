"use client";

import { Check, Circle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/types/product";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: number | null;
  onVariantChange: (variantId: number) => void;
  displayMode?: "dropdown" | "swatches" | "color-swatches";
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(price);
}

function getStockStatus(stock: number | null): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  const quantity = stock ?? 0;
  if (quantity === 0) {
    return { label: "Sold Out", variant: "destructive" };
  }
  if (quantity <= 3) {
    return { label: `Only ${quantity} left`, variant: "outline" };
  }
  return { label: "In Stock", variant: "secondary" };
}

interface ColorSwatchProps {
  variant: ProductVariant;
  isSelected: boolean;
  isOutOfStock: boolean;
  onSelect: () => void;
}

function ColorSwatch({ variant, isSelected, isOutOfStock, onSelect }: ColorSwatchProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onSelect}
          disabled={isOutOfStock}
          role="radio"
          aria-checked={isSelected}
          aria-label={`${variant.name}${isOutOfStock ? " - Sold out" : ""}`}
          className={cn(
            "relative h-10 w-10 rounded-full transition-all duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isSelected && "ring-2 ring-primary ring-offset-2",
            isOutOfStock && "cursor-not-allowed opacity-40"
          )}
          style={{ backgroundColor: variant.colorHex || "#e5e5e5" }}
        >
          {isSelected && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Check
                className={cn(
                  "h-5 w-5",
                  // Use white or dark check based on color brightness
                  isLightColor(variant.colorHex) ? "text-stone-800" : "text-white"
                )}
              />
            </span>
          )}
          {isOutOfStock && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="h-[2px] w-8 rotate-45 bg-destructive" />
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="font-body">
        <p className="font-medium">{variant.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatPrice(variant.price)}
          {isOutOfStock && " • Sold out"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

// Determine if a hex color is light (for contrast purposes)
function isLightColor(hex: string | null): boolean {
  if (!hex) return true;
  const color = hex.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export function VariantSelector({
  variants,
  selectedVariantId,
  onVariantChange,
  displayMode: explicitDisplayMode,
}: VariantSelectorProps) {
  const sortedVariants = [...variants].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );

  const selectedVariant = sortedVariants.find((v) => v.id === selectedVariantId);

  // Auto-detect display mode: use color swatches if any variant has a colorHex set
  const hasColorSwatches = sortedVariants.some((v) => v.colorHex);
  const displayMode = explicitDisplayMode ?? (hasColorSwatches ? "color-swatches" : "swatches");

  if (sortedVariants.length === 0) {
    return null;
  }

  if (sortedVariants.length === 1) {
    const variant = sortedVariants[0];
    const stockStatus = getStockStatus(variant.stock);
    return (
      <div className="space-y-2">
        <p className="text-sm font-body text-muted-foreground">Colorway</p>
        <div className="flex items-center gap-3">
          <span className="font-heading text-lg">{variant.name}</span>
          <Badge variant={stockStatus.variant} className="font-body">
            {stockStatus.label}
          </Badge>
        </div>
      </div>
    );
  }

  if (displayMode === "dropdown") {
    return (
      <div className="space-y-2">
        <label
          htmlFor="variant-select"
          className="text-sm font-body text-muted-foreground"
        >
          Select Colorway
        </label>
        <Select
          value={selectedVariantId?.toString() ?? ""}
          onValueChange={(value) => onVariantChange(parseInt(value, 10))}
        >
          <SelectTrigger id="variant-select" className="w-full font-body">
            <SelectValue placeholder="Choose a colorway" />
          </SelectTrigger>
          <SelectContent>
            {sortedVariants.map((variant) => {
              const stockStatus = getStockStatus(variant.stock);
              const isOutOfStock = (variant.stock ?? 0) === 0;
              return (
                <SelectItem
                  key={variant.id}
                  value={variant.id.toString()}
                  disabled={isOutOfStock}
                  className="font-body"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className={cn(isOutOfStock && "text-muted-foreground line-through")}>
                      {variant.name}
                    </span>
                    <span className="text-muted-foreground">
                      {formatPrice(variant.price)}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {selectedVariant && (
          <div className="flex items-center gap-2 pt-1">
            <Badge variant={getStockStatus(selectedVariant.stock).variant} className="font-body">
              {getStockStatus(selectedVariant.stock).label}
            </Badge>
          </div>
        )}
      </div>
    );
  }

  // Color swatches display mode (compact circular swatches)
  if (displayMode === "color-swatches") {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-body text-muted-foreground">
              Colorway:{" "}
              {selectedVariant && (
                <span className="font-medium text-foreground">{selectedVariant.name}</span>
              )}
            </p>
            {selectedVariant && (
              <Badge
                variant={getStockStatus(selectedVariant.stock).variant}
                className="font-body"
              >
                {getStockStatus(selectedVariant.stock).label}
              </Badge>
            )}
          </div>

          <div
            className="flex flex-wrap gap-3"
            role="radiogroup"
            aria-label="Select colorway"
          >
            {sortedVariants.map((variant) => {
              const isSelected = variant.id === selectedVariantId;
              const isOutOfStock = (variant.stock ?? 0) === 0;

              return (
                <ColorSwatch
                  key={variant.id}
                  variant={variant}
                  isSelected={isSelected}
                  isOutOfStock={isOutOfStock}
                  onSelect={() => onVariantChange(variant.id)}
                />
              );
            })}
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Swatches display mode (card-style buttons)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-body text-muted-foreground">
          Colorway:{" "}
          {selectedVariant && (
            <span className="font-medium text-foreground">{selectedVariant.name}</span>
          )}
        </p>
        {selectedVariant && (
          <Badge
            variant={getStockStatus(selectedVariant.stock).variant}
            className="font-body"
          >
            {getStockStatus(selectedVariant.stock).label}
          </Badge>
        )}
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Select colorway"
      >
        {sortedVariants.map((variant) => {
          const isSelected = variant.id === selectedVariantId;
          const isOutOfStock = (variant.stock ?? 0) === 0;

          return (
            <button
              key={variant.id}
              onClick={() => onVariantChange(variant.id)}
              disabled={isOutOfStock}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${variant.name} - ${formatPrice(variant.price)}${isOutOfStock ? " - Sold out" : ""}`}
              className={cn(
                "group relative flex items-center gap-2 rounded-lg border px-4 py-3 transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-background hover:border-primary/50 hover:bg-secondary/50",
                isOutOfStock && "cursor-not-allowed opacity-50"
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                )}
              >
                {isSelected ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Circle className="h-3 w-3 opacity-0" />
                )}
              </div>
              <div className="text-left">
                <p
                  className={cn(
                    "font-heading text-sm",
                    isOutOfStock && "line-through"
                  )}
                >
                  {variant.name}
                </p>
                <p className="font-body text-xs text-muted-foreground">
                  {formatPrice(variant.price)}
                </p>
              </div>
              {isOutOfStock && (
                <span className="absolute -top-2 -right-2 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-body text-white">
                  Sold out
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
