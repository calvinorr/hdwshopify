import { Metadata } from "next";
import Link from "next/link";
import { db, products, categories } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { Leaf, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Collections | Herbarium Dyeworks",
  description:
    "Explore our naturally dyed yarn collections. From laceweight to aran, find the perfect yarn for your next project.",
  openGraph: {
    title: "Collections | Herbarium Dyeworks",
    description:
      "Explore our naturally dyed yarn collections. From laceweight to aran, find the perfect yarn for your next project.",
  },
};

export const revalidate = 3600; // Revalidate every hour

interface CategoryWithCount {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  position: number | null;
  productCount: number;
  children?: CategoryWithCount[];
}

async function getCollectionsWithCounts(): Promise<CategoryWithCount[]> {
  try {
    // Get only active categories (filter out draft and archived)
    const allCategories = await db.query.categories.findMany({
      where: eq(categories.status, "active"),
      orderBy: (categories, { asc }) => [asc(categories.position)],
    });

    // Get product counts for each category
    const productCounts = await db
      .select({
        categoryId: products.categoryId,
        count: count(),
      })
      .from(products)
      .where(eq(products.status, "active"))
      .groupBy(products.categoryId);

    const countMap = new Map(
      productCounts.map((pc) => [pc.categoryId, pc.count])
    );

    // Build hierarchical structure with counts
    const categoriesWithCounts: CategoryWithCount[] = allCategories.map(
      (cat) => ({
        ...cat,
        productCount: countMap.get(cat.id) || 0,
      })
    );

    // Separate top-level and child categories
    const topLevel = categoriesWithCounts.filter((cat) => !cat.parentId);
    const childCategories = categoriesWithCounts.filter((cat) => cat.parentId);

    // Attach children to parents
    return topLevel.map((parent) => ({
      ...parent,
      children: childCategories.filter((child) => child.parentId === parent.id),
    }));
  } catch (error) {
    // Return empty array if database is not available
    console.warn("Could not fetch collections:", error);
    return [];
  }
}

function CollectionCard({ collection }: { collection: CategoryWithCount }) {
  const hasChildren = collection.children && collection.children.length > 0;
  const totalProducts = hasChildren
    ? collection.children!.reduce((sum, child) => sum + child.productCount, 0) +
      collection.productCount
    : collection.productCount;

  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
    >
      {/* Decorative botanical accent */}
      <div className="absolute -right-4 -top-4 opacity-5 transition-opacity group-hover:opacity-10">
        <Leaf className="h-24 w-24 rotate-12 text-primary" strokeWidth={1} />
      </div>

      <div className="relative space-y-3">
        {/* Collection name */}
        <h2 className="font-heading text-xl tracking-wide text-foreground transition-colors group-hover:text-primary md:text-2xl">
          {collection.name}
        </h2>

        {/* Description */}
        {collection.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {collection.description}
          </p>
        )}

        {/* Subcategories preview */}
        {hasChildren && (
          <div className="flex flex-wrap gap-2 pt-2">
            {collection.children!.slice(0, 4).map((child) => (
              <span
                key={child.id}
                className="inline-flex items-center rounded-full bg-secondary/50 px-2.5 py-0.5 text-xs text-secondary-foreground"
              >
                {child.name}
              </span>
            ))}
            {collection.children!.length > 4 && (
              <span className="inline-flex items-center rounded-full bg-secondary/50 px-2.5 py-0.5 text-xs text-secondary-foreground">
                +{collection.children!.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Footer with count and arrow */}
        <div className="flex items-center justify-between pt-2">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Leaf className="h-3.5 w-3.5" />
            {totalProducts} {totalProducts === 1 ? "product" : "products"}
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
}

export default async function CollectionsPage() {
  const collections = await getCollectionsWithCounts();

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Page Header */}
          <div className="mb-8 md:mb-12">
            <div className="flex items-center justify-center gap-3 md:justify-start">
              <div className="h-px w-12 bg-border" />
              <Leaf
                className="h-5 w-5 text-primary/60"
                strokeWidth={1.5}
              />
              <div className="h-px w-12 bg-border" />
            </div>
            <h1 className="mt-4 text-center font-heading text-3xl tracking-wide text-foreground md:text-left md:text-4xl lg:text-5xl">
              Our Collections
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-muted-foreground md:mx-0 md:text-left md:text-lg">
              Explore our range of naturally dyed yarns, each colored with
              botanical dyes and crafted with care in Northern Ireland.
            </p>
          </div>

          {/* Collections Grid */}
          {collections.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/50">
                <Leaf className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 font-heading text-xl font-medium text-foreground">
                No collections yet
              </h3>
              <p className="max-w-md font-body text-muted-foreground">
                We&apos;re preparing our collections. Check back soon for our
                naturally dyed yarns.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
