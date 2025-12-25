import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { desc, eq, count } from "drizzle-orm";
import Link from "next/link";
import { Plus, FolderTree, MoreHorizontal, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

async function getCollections() {
  const collections = await db.query.categories.findMany({
    orderBy: [desc(categories.position), desc(categories.createdAt)],
  });

  // Get product counts for each collection
  const collectionsWithCounts = await Promise.all(
    collections.map(async (collection) => {
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

  return collectionsWithCounts;
}

export default async function CollectionsPage() {
  const collections = await getCollections();

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="aspect-video bg-stone-100 relative">
                {collection.image ? (
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <FolderTree className="h-10 w-10 text-stone-300" />
                  </div>
                )}

                {/* Actions */}
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/collections/${collection.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/collections/${collection.slug}`} target="_blank">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          View on site
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Info */}
              <Link
                href={`/admin/collections/${collection.id}`}
                className="block p-4"
              >
                <h3 className="font-medium text-stone-900">{collection.name}</h3>
                <p className="text-sm text-stone-500 mt-1">
                  {collection.productCount} product
                  {collection.productCount !== 1 ? "s" : ""}
                </p>
                {collection.description && (
                  <p className="text-sm text-stone-600 mt-2 line-clamp-2">
                    {collection.description}
                  </p>
                )}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
