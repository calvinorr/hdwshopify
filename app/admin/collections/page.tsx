import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { asc, eq, count } from "drizzle-orm";
import Link from "next/link";
import { Plus, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SortableCollectionGrid } from "@/components/admin/sortable-collection-grid";

async function getCollections(statusFilter?: string) {
  const collections = await db.query.categories.findMany({
    orderBy: [asc(categories.position), asc(categories.createdAt)],
  });

  // Filter by status if specified
  const filteredCollections = statusFilter && statusFilter !== "all"
    ? collections.filter(c => c.status === statusFilter)
    : collections;

  // Get product counts for each collection
  const collectionsWithCounts = await Promise.all(
    filteredCollections.map(async (collection) => {
      const [{ productCount }] = await db
        .select({ productCount: count() })
        .from(products)
        .where(eq(products.categoryId, collection.id));

      return {
        ...collection,
        productCount,
      };
    })
  );

  return {
    collections: collectionsWithCounts,
    allCount: collections.length,
    draftCount: collections.filter(c => c.status === "draft").length,
    activeCount: collections.filter(c => c.status === "active" || !c.status).length,
    archivedCount: collections.filter(c => c.status === "archived").length,
  };
}

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function CollectionsPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const { collections, allCount, draftCount, activeCount, archivedCount } = await getCollections(status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-stone-900">
            Collections
          </h1>
          <p className="text-stone-600 mt-1">
            Organize your products into collections
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/collections/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Collection
          </Link>
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b pb-4">
        <Link
          href="/admin/collections"
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            !status || status === "all"
              ? "bg-stone-900 text-white"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          All ({allCount})
        </Link>
        <Link
          href="/admin/collections?status=active"
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            status === "active"
              ? "bg-green-600 text-white"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          Active ({activeCount})
        </Link>
        <Link
          href="/admin/collections?status=draft"
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            status === "draft"
              ? "bg-yellow-600 text-white"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          Draft ({draftCount})
        </Link>
        <Link
          href="/admin/collections?status=archived"
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            status === "archived"
              ? "bg-stone-600 text-white"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          Archived ({archivedCount})
        </Link>
      </div>

      {/* Collections grid */}
      {collections.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <FolderTree className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-900 mb-2">
            No collections yet
          </h3>
          <p className="text-stone-500 mb-4">
            Create collections to organize your products.
          </p>
          <Button asChild>
            <Link href="/admin/collections/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Collection
            </Link>
          </Button>
        </div>
      ) : (
        <SortableCollectionGrid collections={collections} />
      )}
    </div>
  );
}
