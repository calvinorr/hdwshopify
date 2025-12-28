import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db, categories, products } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { CollectionHeader, CollectionNav } from "@/components/collections";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@/lib/db/schema";
import type { ProductWithRelations } from "@/types/product";
import { CollectionProducts } from "./collection-products";

export const revalidate = 3600; // Revalidate every hour (ISR)

interface CollectionWithChildren extends Category {
  children?: Category[];
  parent?: Category | null;
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Generate static params for all collection slugs
export async function generateStaticParams() {
  try {
    const allCategories = await db.query.categories.findMany({
      columns: { slug: true },
    });

    // Include "all" for the all-products virtual collection
    return [
      { slug: "all" },
      ...allCategories.map((category) => ({
        slug: category.slug,
      })),
    ];
  } catch (error) {
    // Return empty array if database is not available (e.g., during initial build)
    console.warn("Could not fetch categories for static params:", error);
    return [{ slug: "all" }];
  }
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Special metadata for "all" collection
  if (slug === "all") {
    return {
      title: "All Products | Herbarium Dyeworks",
      description: "Browse our complete range of naturally dyed yarns.",
      openGraph: {
        title: "All Products | Herbarium Dyeworks",
        description: "Browse our complete range of naturally dyed yarns.",
      },
    };
  }

  try {
    const category = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });

    if (!category) {
      return {
        title: "Collection Not Found | Herbarium Dyeworks",
      };
    }

    const title = `${category.name} | Herbarium Dyeworks`;
    const description =
      category.description ||
      `Shop our ${category.name} collection of naturally dyed yarns.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Collection | Herbarium Dyeworks",
    };
  }
}

async function getCollection(slug: string): Promise<{
  collection: CollectionWithChildren;
  products: ProductWithRelations[];
} | null> {
  try {
    // Special handling for "all" collection - show all products
    if (slug === "all") {
      const allProducts = await db.query.products.findMany({
        orderBy: [desc(products.featured), desc(products.createdAt)],
        with: {
          variants: {
            orderBy: (variants, { asc }) => [asc(variants.position)],
          },
          images: {
            orderBy: (images, { asc }) => [asc(images.position)],
          },
          category: true,
        },
      });

      const activeProducts = allProducts.filter(
        (p) => p.status === "active"
      ) as ProductWithRelations[];

      // Return a virtual "All Products" collection
      return {
        collection: {
          id: 0,
          name: "All Products",
          slug: "all",
          description: "Browse our complete range of naturally dyed yarns.",
          image: null,
          parentId: null,
          position: 0,
          shopifyCollectionId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as CollectionWithChildren,
        products: activeProducts,
      };
    }

    // Fetch category with children (only active collections)
    const category = await db.query.categories.findFirst({
      where: and(
        eq(categories.slug, slug),
        eq(categories.status, "active")
      ),
      with: {
        parent: true,
        children: {
          where: eq(categories.status, "active"),
          orderBy: (categories, { asc }) => [asc(categories.position)],
        },
      },
    });

    if (!category) {
      return null;
    }

    // Fetch products in this category with all variants and images
    const categoryProducts = await db.query.products.findMany({
      where: eq(products.categoryId, category.id),
      orderBy: [desc(products.featured), desc(products.createdAt)],
      with: {
        variants: {
          orderBy: (variants, { asc }) => [asc(variants.position)],
        },
        images: {
          orderBy: (images, { asc }) => [asc(images.position)],
        },
        category: true,
      },
    });

    // Filter to only active products
    const activeProducts = categoryProducts.filter(
      (p) => p.status === "active"
    ) as ProductWithRelations[];

    return {
      collection: category as CollectionWithChildren,
      products: activeProducts,
    };
  } catch (error) {
    console.warn("Could not fetch collection:", error);
    return null;
  }
}

async function getAllCollections(): Promise<CollectionWithChildren[]> {
  try {
    // Only fetch active collections
    const allCategories = await db.query.categories.findMany({
      where: eq(categories.status, "active"),
      orderBy: (categories, { asc }) => [asc(categories.position)],
      with: {
        children: {
          where: eq(categories.status, "active"),
          orderBy: (categories, { asc }) => [asc(categories.position)],
        },
      },
    });

    // Filter to top-level only
    return allCategories.filter(
      (cat) => !cat.parentId
    ) as CollectionWithChildren[];
  } catch (error) {
    console.warn("Could not fetch all collections:", error);
    return [];
  }
}

function CollectionProductsLoadingFallback() {
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
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-10 w-24 lg:hidden" />
          <Skeleton className="h-10 w-[180px] ml-auto" />
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

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;

  const [collectionData, allCollections] = await Promise.all([
    getCollection(slug),
    getAllCollections(),
  ]);

  if (!collectionData) {
    notFound();
  }

  const { collection, products: collectionProducts } = collectionData;

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Collection Navigation */}
          <CollectionNav collections={allCollections} currentSlug={slug} />

          {/* Collection Header */}
          <CollectionHeader
            name={collection.name}
            description={collection.description}
            productCount={collectionProducts.length}
          />

          {/* Products with client-side filtering/sorting - wrapped in Suspense for useSearchParams */}
          <Suspense fallback={<CollectionProductsLoadingFallback />}>
            <CollectionProducts products={collectionProducts} slug={slug} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
