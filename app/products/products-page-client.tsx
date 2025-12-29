"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  ProductGrid,
  ProductFilters,
  ProductFiltersMobile,
  ProductSort,
} from "@/components/products";
import type {
  ProductWithRelations,
  ProductFilters as ProductFiltersType,
  FilterOptions,
  SortOption,
  YarnWeight,
} from "@/types/product";

interface ProductsPageClientProps {
  initialProducts: ProductWithRelations[];
  filterOptions: FilterOptions;
}

const PRODUCTS_PER_PAGE = 12;

export function ProductsPageClient({
  initialProducts,
  filterOptions,
}: ProductsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse initial state from URL
  const initialSort = (searchParams.get("sort") as SortOption) || "featured";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [currentSort, setCurrentSort] = useState<SortOption>(initialSort);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [filters, setFilters] = useState<ProductFiltersType>({
    weight: [],
    fiberContent: [],
    availability: [],
  });

  // Update URL params
  const updateParams = (sort: SortOption, page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort !== "featured") {
      params.set("sort", sort);
    } else {
      params.delete("sort");
    }
    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  const handleSortChange = (sort: SortOption) => {
    setCurrentSort(sort);
    setCurrentPage(1);
    updateParams(sort, 1);
  };

  const handleFilterChange = (newFilters: ProductFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...initialProducts];

    // Apply filters
    if (filters.weight.length > 0) {
      result = result.filter(
        (p) => p.weight && filters.weight.includes(p.weight as YarnWeight)
      );
    }

    if (filters.fiberContent.length > 0) {
      result = result.filter(
        (p) => p.fiberContent && filters.fiberContent.includes(p.fiberContent)
      );
    }

    if (filters.availability.length > 0) {
      result = result.filter((p) => {
        const stock = p.stock ?? 0;
        if (filters.availability.includes("in-stock") && stock > 5) {
          return true;
        }
        if (
          filters.availability.includes("low-stock") &&
          stock > 0 &&
          stock <= 5
        ) {
          return true;
        }
        if (filters.availability.includes("sold-out") && stock === 0) {
          return true;
        }
        return false;
      });
    }

    // Apply sorting
    switch (currentSort) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case "featured":
      default:
        // Featured products first, then by position/date
        result.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }

    return result;
  }, [initialProducts, filters, currentSort]);

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedProducts.length / PRODUCTS_PER_PAGE
  );
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateParams(currentSort, page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeFilterCount =
    filters.weight.length +
    filters.fiberContent.length +
    filters.availability.length;

  return (
    <div className="flex gap-8">
      {/* Desktop Filters Sidebar */}
      <ProductFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        options={filterOptions}
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-4">
            {/* Mobile Filters */}
            <ProductFiltersMobile
              filters={filters}
              onFilterChange={handleFilterChange}
              options={filterOptions}
            />

            {/* Results count */}
            <p className="font-body text-sm text-muted-foreground">
              {filteredAndSortedProducts.length}{" "}
              {filteredAndSortedProducts.length === 1 ? "product" : "products"}
              {activeFilterCount > 0 && " (filtered)"}
            </p>
          </div>

          <ProductSort currentSort={currentSort} onSortChange={handleSortChange} />
        </div>

        {/* Product Grid */}
        <ProductGrid products={paginatedProducts} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 font-body text-sm border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, and pages around current
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1;

                // Show ellipsis
                const showEllipsisBefore =
                  page === currentPage - 2 && currentPage > 3;
                const showEllipsisAfter =
                  page === currentPage + 2 && currentPage < totalPages - 2;

                if (showEllipsisBefore || showEllipsisAfter) {
                  return (
                    <span
                      key={`ellipsis-${page}`}
                      className="px-2 font-body text-sm text-muted-foreground"
                    >
                      ...
                    </span>
                  );
                }

                if (!showPage) return null;

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 font-body text-sm rounded-md transition-colors ${
                      page === currentPage
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 font-body text-sm border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
