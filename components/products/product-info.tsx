"use client";

import {
  Leaf,
  Scale,
  Ruler,
  Droplets,
  Tag,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProductWithRelations } from "@/types/product";

interface ProductInfoProps {
  product: ProductWithRelations;
}

interface SpecItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}

function SpecItem({ icon, label, value }: SpecItemProps) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg bg-secondary/30 p-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-body uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="font-body text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

// Weight category colors for visual distinction
const weightColors: Record<string, string> = {
  Laceweight: "bg-rose-100 text-rose-800 border-rose-200",
  "4ply": "bg-amber-100 text-amber-800 border-amber-200",
  DK: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Aran: "bg-sky-100 text-sky-800 border-sky-200",
  Worsted: "bg-violet-100 text-violet-800 border-violet-200",
  Bulky: "bg-stone-200 text-stone-800 border-stone-300",
};

export function ProductInfo({ product }: ProductInfoProps) {
  const weightColorClass = product.weight ? weightColors[product.weight] : undefined;

  return (
    <div className="space-y-6">
      {/* Category and Weight Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {product.category && (
          <Badge variant="outline" className="font-body">
            <Tag className="mr-1.5 h-3 w-3" />
            {product.category.name}
          </Badge>
        )}
        {product.weight && (
          <Badge
            variant="outline"
            className={cn(
              "font-body font-medium",
              weightColorClass || "bg-secondary text-secondary-foreground"
            )}
          >
            <Scale className="mr-1.5 h-3 w-3" />
            {product.weight}
          </Badge>
        )}
      </div>

      {/* Product Title */}
      <div>
        <h1 className="font-heading text-2xl tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {product.name}
        </h1>
      </div>

      {/* Description */}
      {product.description && (
        <div className="space-y-2">
          <div
            className="prose prose-sm max-w-none font-body text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      {/* Specifications Grid */}
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 font-heading text-lg text-foreground">
          <Info className="h-4 w-4" />
          Yarn Specifications
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <SpecItem
            icon={<Leaf className="h-4 w-4" />}
            label="Fiber Content"
            value={product.fiberContent}
          />
          <SpecItem
            icon={<Scale className="h-4 w-4" />}
            label="Weight Category"
            value={product.weight}
          />
          <SpecItem
            icon={<Ruler className="h-4 w-4" />}
            label="Yardage"
            value={product.yardage}
          />
          <SpecItem
            icon={<Droplets className="h-4 w-4" />}
            label="Care Instructions"
            value={product.careInstructions}
          />
        </div>
      </div>

      {/* Additional Info Note */}
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
        <p className="text-sm font-body text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Natural dyes:</span> Each skein is hand-dyed
          using botanical dyes, creating unique variations in colour. Minor differences between
          skeins add to the artisanal character of your finished project.
        </p>
      </div>
    </div>
  );
}
