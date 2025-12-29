import { db } from "@/lib/db";
import { products, productTags, productTagAssignments } from "@/lib/db/schema";
import { desc, eq, like, or, count, inArray, asc } from "drizzle-orm";
import Link from "next/link";
import { Plus, Package, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductsTable } from "./products-table";

interface Props {
  searchParams: Promise<{
    q?: string;
    status?: string;
    tag?: string;
    page?: string;
  }>;
}

const ITEMS_PER_PAGE = 20;

async function getTags() {
  return db.query.productTags.findMany({
    orderBy: [asc(productTags.name)],
  });
}

async function getProducts(search?: string, status?: string, tagId?: number, page = 1) {
  const offset = (page - 1) * ITEMS_PER_PAGE;

  // If filtering by tag, first get the product IDs that have that tag
  let productIdsWithTag: number[] | undefined;
  if (tagId) {
    const tagAssignments = await db
      .select({ productId: productTagAssignments.productId })
      .from(productTagAssignments)
      .where(eq(productTagAssignments.tagId, tagId));
    productIdsWithTag = tagAssignments.map((a) => a.productId);

    // If no products have this tag, return empty
    if (productIdsWithTag.length === 0) {
      return {
        products: [],
        total: 0,
        pages: 0,
        currentPage: page,
      };
    }
  }

  // Build where conditions
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(products.name, `%${search}%`),
        like(products.slug, `%${search}%`)
      )
    );
  }

  if (status && status !== "all") {
    conditions.push(eq(products.status, status as "active" | "draft" | "archived"));
  }

  if (productIdsWithTag) {
    conditions.push(inArray(products.id, productIdsWithTag));
  }

  const whereClause = conditions.length > 0 ? conditions.reduce((a, b) => a && b) : undefined;

  const [productList, [{ total }]] = await Promise.all([
    db.query.products.findMany({
      where: whereClause,
      limit: ITEMS_PER_PAGE,
      offset,
      orderBy: [desc(products.updatedAt)],
      with: {
        images: {
          limit: 1,
          orderBy: (images, { asc }) => [asc(images.position)],
        },
        category: true,
        tagAssignments: {
          with: {
            tag: true,
          },
        },
      },
    }),
    db.select({ total: count() }).from(products).where(whereClause),
  ]);

  return {
    products: productList,
    total,
    pages: Math.ceil(total / ITEMS_PER_PAGE),
    currentPage: page,
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const search = params.q;
  const status = params.status;
  const tag = params.tag;
  const tagId = tag ? parseInt(tag, 10) : undefined;
  const page = parseInt(params.page || "1", 10);

  const [{ products: productList, total, pages, currentPage }, allTags] = await Promise.all([
    getProducts(search, status, tagId, page),
    getTags(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-stone-900">
            Products
          </h1>
          <p className="text-stone-600 mt-1">
            {total} product{total !== 1 ? "s" : ""} in your store
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <form className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Status filter */}
          <select
            name="status"
            defaultValue={status || "all"}
            className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <select
              name="tag"
              defaultValue={tag || ""}
              className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">All tags</option>
              {allTags.map((t) => (
                <option key={t.id} value={t.id.toString()}>
                  {t.name}
                </option>
              ))}
            </select>
          )}

          <Button type="submit" variant="secondary">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </form>
      </div>

      {/* Products table */}
      {productList.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Package className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-900 mb-2">
            No products found
          </h3>
          <p className="text-stone-500 mb-4">
            {search
              ? `No products match "${search}"`
              : "Get started by adding your first product."}
          </p>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <ProductsTable products={productList} />

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg border p-4">
              <p className="text-sm text-stone-600">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total}
              </p>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/admin/products?page=${currentPage - 1}${
                        search ? `&q=${search}` : ""
                      }${status ? `&status=${status}` : ""}${tag ? `&tag=${tag}` : ""}`}
                    >
                      Previous
                    </Link>
                  </Button>
                )}
                {currentPage < pages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/admin/products?page=${currentPage + 1}${
                        search ? `&q=${search}` : ""
                      }${status ? `&status=${status}` : ""}${tag ? `&tag=${tag}` : ""}`}
                    >
                      Next
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
