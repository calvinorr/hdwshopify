import { cn } from "@/lib/utils";
import { Leaf } from "lucide-react";

interface CollectionHeaderProps {
  name: string;
  description?: string | null;
  productCount: number;
  className?: string;
}

export function CollectionHeader({
  name,
  description,
  productCount,
  className,
}: CollectionHeaderProps) {
  return (
    <div className={cn("relative mb-8 md:mb-12", className)}>
      {/* Decorative botanical accent */}
      <div className="absolute -left-4 top-0 hidden opacity-10 md:block">
        <Leaf className="h-24 w-24 rotate-[-15deg] text-primary" strokeWidth={1} />
      </div>

      <div className="relative space-y-4 text-center md:text-left">
        {/* Collection title */}
        <h1 className="font-heading text-3xl tracking-wide text-foreground md:text-4xl lg:text-5xl">
          {name}
        </h1>

        {/* Description */}
        {description && (
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground md:mx-0 md:text-lg">
            {description}
          </p>
        )}

        {/* Product count */}
        <div className="flex items-center justify-center gap-2 md:justify-start">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
            <Leaf className="h-3.5 w-3.5" />
            {productCount} {productCount === 1 ? "product" : "products"}
          </span>
        </div>
      </div>

      {/* Decorative divider */}
      <div className="mt-6 flex items-center justify-center gap-3 md:justify-start">
        <div className="h-px w-12 bg-border" />
        <Leaf className="h-4 w-4 text-primary/40" strokeWidth={1.5} />
        <div className="h-px w-12 bg-border" />
      </div>
    </div>
  );
}
