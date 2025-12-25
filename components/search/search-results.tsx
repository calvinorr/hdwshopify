"use client";

import { cn } from "@/lib/utils";
import { ProductGrid } from "@/components/products/product-grid";
import { Leaf, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ProductWithRelations } from "@/types/product";

interface SearchResultsProps {
  products: ProductWithRelations[];
  query: string;
  isLoading?: boolean;
  className?: string;
}

const searchSuggestions = [
  { label: "Merino wool", query: "merino" },
  { label: "Indigo dyed", query: "indigo" },
  { label: "DK weight", query: "dk" },
  { label: "Laceweight", query: "laceweight" },
  { label: "Silk blend", query: "silk" },
  { label: "Plant dyed", query: "plant dyed" },
];

export function SearchResults({
  products,
  query,
  isLoading = false,
  className,
}: SearchResultsProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={cn("", className)}>
        <div className="mb-6 flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm font-body">Searching for &quot;{query}&quot;...</span>
        </div>
        <LoadingGrid />
      </div>
    );
  }

  // Empty query state
  if (!query) {
    return (
      <div className={cn("", className)}>
        <EmptyQueryState />
      </div>
    );
  }

  // No results state
  if (products.length === 0) {
    return (
      <div className={cn("", className)}>
        <NoResultsState query={query} />
      </div>
    );
  }

  // Results
  return (
    <div className={cn("", className)}>
      {/* Results header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm font-body text-muted-foreground">
          Found{" "}
          <span className="font-medium text-foreground">{products.length}</span>{" "}
          {products.length === 1 ? "result" : "results"} for{" "}
          <span className="font-medium text-foreground">&quot;{query}&quot;</span>
        </p>
      </div>

      {/* Product grid */}
      <ProductGrid products={products} />
    </div>
  );
}

function EmptyQueryState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-6 rounded-full bg-secondary p-4">
        <Search className="h-8 w-8 text-primary" strokeWidth={1.5} />
      </div>
      <h3 className="font-heading text-xl text-foreground">Search our collection</h3>
      <p className="mt-2 max-w-md text-sm font-body text-muted-foreground">
        Find the perfect naturally dyed yarn for your next project. Search by
        fiber, dye, weight, or colorway.
      </p>

      {/* Popular searches */}
      <div className="mt-8">
        <p className="mb-3 flex items-center justify-center gap-1.5 text-xs font-body uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Popular searches
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {searchSuggestions.slice(0, 4).map((suggestion) => (
            <Link
              key={suggestion.query}
              href={`/search?q=${encodeURIComponent(suggestion.query)}`}
              className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 text-sm font-body text-foreground transition-colors hover:border-primary/50 hover:bg-accent"
            >
              {suggestion.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function NoResultsState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-6 rounded-full bg-secondary p-4">
        <Leaf className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="font-heading text-xl text-foreground">No results found</h3>
      <p className="mt-2 max-w-md text-sm font-body text-muted-foreground">
        We couldn&apos;t find any products matching &quot;{query}&quot;. Try a different
        search term or browse our collections.
      </p>

      {/* Suggestions */}
      <div className="mt-8">
        <p className="mb-3 text-xs font-body uppercase tracking-wide text-muted-foreground">
          Try searching for
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {searchSuggestions.map((suggestion) => (
            <Link
              key={suggestion.query}
              href={`/search?q=${encodeURIComponent(suggestion.query)}`}
              className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 text-sm font-body text-foreground transition-colors hover:border-primary/50 hover:bg-accent"
            >
              {suggestion.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Browse collections link */}
      <Link
        href="/collections"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium font-body text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Leaf className="h-4 w-4" />
        Browse all collections
      </Link>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-lg bg-card"
        >
          <div className="aspect-square bg-secondary/50" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-16 rounded bg-secondary/70" />
            <div className="h-5 w-3/4 rounded bg-secondary/70" />
            <div className="flex gap-2">
              <div className="h-4 w-12 rounded bg-secondary/70" />
              <div className="h-4 w-16 rounded bg-secondary/70" />
            </div>
            <div className="h-6 w-20 rounded bg-secondary/70" />
          </div>
        </div>
      ))}
    </div>
  );
}
