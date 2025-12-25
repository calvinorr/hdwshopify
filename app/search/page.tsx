"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, Suspense } from "react";
import { SearchInput, SearchResults } from "@/components/search";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import type { ProductWithRelations } from "@/types/product";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";

  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch search results when query changes
  useEffect(() => {
    if (!query) {
      setProducts([]);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=20`
        );
        if (response.ok) {
          const data = await response.json();
          setProducts(data.results ?? data.products ?? []);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  // Handle search input - update URL
  const handleSearch = useCallback(
    (newQuery: string) => {
      const params = new URLSearchParams();
      if (newQuery) {
        params.set("q", newQuery);
      }
      router.push(`/search?${params.toString()}`);
    },
    [router]
  );

  return (
    <>
      {/* Search Hero */}
      <section className="border-b bg-secondary/20 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-heading text-3xl tracking-wide md:text-4xl">
              Search
            </h1>
            <p className="mt-3 font-body text-muted-foreground">
              Find naturally dyed yarns by fiber, colorway, weight, or dye type
            </p>
            <div className="mx-auto mt-6 max-w-lg">
              <SearchInput
                onSearch={handleSearch}
                defaultValue={query}
                placeholder="Search yarns, dyes, fibers..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <SearchResults
            products={products}
            query={query}
            isLoading={isLoading}
          />
        </div>
      </section>
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <section className="border-b bg-secondary/20 py-12 md:py-16">
              <div className="container mx-auto px-4">
                <div className="mx-auto max-w-2xl text-center">
                  <h1 className="font-heading text-3xl tracking-wide md:text-4xl">
                    Search
                  </h1>
                  <p className="mt-3 font-body text-muted-foreground">
                    Find naturally dyed yarns by fiber, colorway, weight, or dye
                    type
                  </p>
                  <div className="mx-auto mt-6 h-10 max-w-lg animate-pulse rounded-full bg-secondary" />
                </div>
              </div>
            </section>
          }
        >
          <SearchContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
