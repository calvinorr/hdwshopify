import { Metadata } from "next";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { db, products } from "@/lib/db";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { ProductsPageClient } from "./products-page-client";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductWithRelations, YarnWeight, FilterOptions } from "@/types/product";

export const metadata: Metadata = {
  title: "Shop All Yarns | Herbarium Dyeworks",
  description:
    "Browse our collection of naturally dyed yarns. Small batch, slow-dyed yarn from Northern Ireland using botanical extracts for beautiful, sustainable colors.",
  openGraph: {
    title: "Shop All Yarns | Herbarium Dyeworks",
    description:
      "Browse our collection of naturally dyed yarns. Small batch, slow-dyed yarn from Northern Ireland using botanical extracts for beautiful, sustainable colors.",
  },
};

async function getProducts(): Promise<ProductWithRelations[]> {
  try {
    const result = await db.query.products.findMany({
      where: eq(products.status, "active"),
      with: {
        variants: {
          orderBy: (variants, { asc }) => [asc(variants.position)],
        },
        images: {
          orderBy: (images, { asc }) => [asc(images.position)],
        },
        category: true,
      },
      orderBy: (products, { desc, asc }) => [
        desc(products.featured),
        asc(products.createdAt),
      ],
    });

    return result;
  } catch (error) {
    console.warn("Could not fetch products:", error);
    return [];
  }
}

function extractFilterOptions(products: ProductWithRelations[]): FilterOptions {
  const weightsSet = new Set<YarnWeight>();
  const fiberContentsSet = new Set<string>();

  for (const product of products) {
    if (product.weight) {
      weightsSet.add(product.weight as YarnWeight);
    }
    if (product.fiberContent) {
      fiberContentsSet.add(product.fiberContent);
    }
  }

  // Sort weights in a logical order
  const weightOrder: YarnWeight[] = ["Laceweight", "4ply", "DK", "Aran"];
  const weights = weightOrder.filter((w) => weightsSet.has(w));

  // Sort fiber contents alphabetically
  const fiberContents = Array.from(fiberContentsSet).sort();

  return { weights, fiberContents };
}

function ProductsLoadingFallback() {
  return (
    <div className="flex gap-8">
      {/* Desktop Filters Skeleton */}
      <aside className="hidden lg:block w-64 shrink-0 pr-8 border-r border-border/50">
        <div className="sticky top-24 space-y-6">
          <Skeleton className="h-6 w-20" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-5 w-32" />
            ))}
          </div>
        </div>
      </aside>
      {/* Main Content Skeleton */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function ProductsPage() {
  const products = await getProducts();
  const filterOptions = extractFilterOptions(products);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Page Header */}
          <div className="mb-8 md:mb-12">
            <h1 className="font-heading text-3xl md:text-4xl font-medium text-foreground">
              All Yarns
            </h1>
            <p className="mt-2 font-body text-muted-foreground max-w-2xl">
              Explore our collection of naturally dyed yarns, each skein uniquely
              colored with botanical extracts and traditional techniques.
            </p>
          </div>

          {/* Products with Client-side Filtering - wrapped in Suspense for useSearchParams */}
          <Suspense fallback={<ProductsLoadingFallback />}>
            <ProductsPageClient
              initialProducts={products}
              filterOptions={filterOptions}
            />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
