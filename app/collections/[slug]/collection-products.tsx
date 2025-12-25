"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductGrid, ProductFilters, ProductFiltersMobile, ProductSort } from "@/components/products";
import type {
  ProductWithRelations,
  ProductFilters as ProductFiltersType,
  FilterOptions,
  SortOption,
  YarnWeight,
} from "@/types/product";

interface CollectionProductsProps {
  products: ProductWithRelations[];
  slug: string;
}

// Derive filter options from products
function deriveFilterOptions(products: ProductWithRelations[]): FilterOptions {
  const weightsSet = new Set<YarnWeight>();
  const fibersSet = new Set<string>();

  products.forEach((product) => {
    if (product.weight) {
      weightsSet.add(product.weight as YarnWeight);
    }
    if (product.fiberContent) {
      fibersSet.add(product.fiberContent);
    }
  });

  return {
    weights: Array.from(weightsSet).sort(),
    fiberContents: Array.from(fibersSet).sort(),
  };
}

// Get product availability status
function getAvailability(
  product: ProductWithRelations
): "in-stock" | "low-stock" | "sold-out" {
  const totalStock = product.variants.reduce(
    (sum, variant) => sum + (variant.stock || 0),
    0
  );
  if (totalStock === 0) return "sold-out";
  if (totalStock <= 3) return "low-stock";
  return "in-stock";
}

// Apply filters to products
function applyFilters(
  products: ProductWithRelations[],
  filters: ProductFiltersType
): ProductWithRelations[] {
  return products.filter((product) => {
    // Weight filter
    if (
      filters.weight.length > 0 &&
      (!product.weight || !filters.weight.includes(product.weight as YarnWeight))
    ) {
      return false;
    }

    // Fiber content filter
    if (
      filters.fiberContent.length > 0 &&
      (!product.fiberContent ||
        !filters.fiberContent.includes(product.fiberContent))
    ) {
      return false;
    }

    // Availability filter
    if (filters.availability.length > 0) {
      const availability = getAvailability(product);
      if (!filters.availability.includes(availability)) {
        return false;
      }
    }

    return true;
  });
}

// Apply sorting to products
function applySort(
  products: ProductWithRelations[],
  sort: SortOption
): ProductWithRelations[] {
  const sorted = [...products];

  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => {
        const priceA = a.variants[0]?.price || a.basePrice;
        const priceB = b.variants[0]?.price || b.basePrice;
        return priceA - priceB;
      });
    case "price-desc":
      return sorted.sort((a, b) => {
        const priceA = a.variants[0]?.price || a.basePrice;
        const priceB = b.variants[0]?.price || b.basePrice;
        return priceB - priceA;
      });
    case "newest":
      return sorted.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    case "featured":
    default:
      return sorted.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
  }
}

// Parse filters from URL search params
function parseFiltersFromParams(
  searchParams: URLSearchParams
): ProductFiltersType {
  const weight = searchParams.get("weight");
  const fiber = searchParams.get("fiber");
  const availability = searchParams.get("availability");

  return {
    weight: weight ? (weight.split(",") as YarnWeight[]) : [],
    fiberContent: fiber ? fiber.split(",") : [],
    availability: availability
      ? (availability.split(",") as ProductFiltersType["availability"])
      : [],
  };
}

// Parse sort from URL search params
function parseSortFromParams(searchParams: URLSearchParams): SortOption {
  const sort = searchParams.get("sort");
  if (
    sort &&
    ["featured", "price-asc", "price-desc", "newest"].includes(sort)
  ) {
    return sort as SortOption;
  }
  return "featured";
}

export function CollectionProducts({ products, slug }: CollectionProductsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parse initial state from URL
  const [filters, setFilters] = useState<ProductFiltersType>(() =>
    parseFiltersFromParams(searchParams)
  );
  const [sort, setSort] = useState<SortOption>(() =>
    parseSortFromParams(searchParams)
  );

  // Sync state with URL on mount and URL changes
  useEffect(() => {
    setFilters(parseFiltersFromParams(searchParams));
    setSort(parseSortFromParams(searchParams));
  }, [searchParams]);

  // Derive filter options from products
  const filterOptions = useMemo(
    () => deriveFilterOptions(products),
    [products]
  );

  // Apply filters and sort
  const displayedProducts = useMemo(() => {
    let result = applyFilters(products, filters);
    result = applySort(result, sort);
    return result;
  }, [products, filters, sort]);

  // Update URL when filters/sort change
  const updateURL = useCallback(
    (newFilters: ProductFiltersType, newSort: SortOption) => {
      const params = new URLSearchParams();

      if (newFilters.weight.length > 0) {
        params.set("weight", newFilters.weight.join(","));
      }
      if (newFilters.fiberContent.length > 0) {
        params.set("fiber", newFilters.fiberContent.join(","));
      }
      if (newFilters.availability.length > 0) {
        params.set("availability", newFilters.availability.join(","));
      }
      if (newSort !== "featured") {
        params.set("sort", newSort);
      }

      const queryString = params.toString();
      const newURL = queryString
        ? `/collections/${slug}?${queryString}`
        : `/collections/${slug}`;

      router.replace(newURL, { scroll: false });
    },
    [slug, router]
  );

  const handleFilterChange = useCallback(
    (newFilters: ProductFiltersType) => {
      setFilters(newFilters);
      updateURL(newFilters, sort);
    },
    [sort, updateURL]
  );

  const handleSortChange = useCallback(
    (newSort: SortOption) => {
      setSort(newSort);
      updateURL(filters, newSort);
    },
    [filters, updateURL]
  );

  return (
    <div className="flex gap-8">
      {/* Desktop Filters Sidebar */}
      <ProductFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        options={filterOptions}
      />

      {/* Main Content */}
      <div className="flex-1">
        {/* Filter + Sort Controls */}
        <div className="mb-6 flex items-center justify-between gap-4">
          {/* Mobile filter trigger */}
          <ProductFiltersMobile
            filters={filters}
            onFilterChange={handleFilterChange}
            options={filterOptions}
          />
          <ProductSort
            currentSort={sort}
            onSortChange={handleSortChange}
            className="ml-auto"
          />
        </div>

        {/* Product Grid */}
        <ProductGrid products={displayedProducts} />
      </div>
    </div>
  );
}
