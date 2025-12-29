import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { desc, eq, lte, gt, and, or, sql, isNull } from "drizzle-orm";
import Link from "next/link";
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InventoryTable } from "./inventory-table";

interface SearchParams {
  status?: string;
  q?: string;
  page?: string;
}

const LOW_STOCK_THRESHOLD = 2;

async function getInventory(searchParams: SearchParams) {
  const page = parseInt(searchParams.page || "1");
  const limit = 30;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (searchParams.status === "out") {
    conditions.push(or(eq(products.stock, 0), isNull(products.stock)));
  } else if (searchParams.status === "low") {
    conditions.push(
      and(
        gt(products.stock, 0),
        lte(products.stock, LOW_STOCK_THRESHOLD)
      )
    );
  } else if (searchParams.status === "in") {
    conditions.push(gt(products.stock, LOW_STOCK_THRESHOLD));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const productList = await db.query.products.findMany({
    where: whereClause,
    orderBy: [products.stock, desc(products.createdAt)],
    limit,
    offset,
    with: {
      images: {
        limit: 1,
        orderBy: (images, { asc }) => [asc(images.position)],
      },
    },
  });

  // Filter by search query
  let filteredProducts = productList;
  if (searchParams.q) {
    const q = searchParams.q.toLowerCase();
    filteredProducts = productList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }

  const [totalCount, outOfStockCount, lowStockCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(products),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(or(eq(products.stock, 0), isNull(products.stock))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(
        and(
          gt(products.stock, 0),
          lte(products.stock, LOW_STOCK_THRESHOLD)
        )
      ),
  ]);

  return {
    products: filteredProducts,
    stats: {
      total: Number(totalCount[0]?.count || 0),
      outOfStock: Number(outOfStockCount[0]?.count || 0),
      lowStock: Number(lowStockCount[0]?.count || 0),
    },
    page,
    limit,
  };
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { products: productList, stats, page, limit } = await getInventory(params);

  const inStock = stats.total - stats.outOfStock - stats.lowStock;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-stone-900">
            Inventory
          </h1>
          <p className="text-stone-600 mt-1">
            Manage stock levels for all products
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/inventory?status=in"
          className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${
            params.status === "in" ? "ring-2 ring-primary" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-stone-900">{inStock}</p>
              <p className="text-sm text-stone-500">In Stock</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/inventory?status=low"
          className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${
            params.status === "low" ? "ring-2 ring-primary" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-stone-900">{stats.lowStock}</p>
              <p className="text-sm text-stone-500">Low Stock (&le;{LOW_STOCK_THRESHOLD})</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/inventory?status=out"
          className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${
            params.status === "out" ? "ring-2 ring-primary" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-stone-900">{stats.outOfStock}</p>
              <p className="text-sm text-stone-500">Out of Stock</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <form className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Search by product or SKU..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <select
            name="status"
            defaultValue={params.status}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">All Stock Levels</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>

          <Button type="submit" variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>

          {(params.status || params.q) && (
            <Button type="button" variant="ghost" asChild>
              <Link href="/admin/inventory">Clear</Link>
            </Button>
          )}
        </form>
      </div>

      {productList.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <BarChart3 className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-900 mb-2">
            No products found
          </h3>
          <p className="text-stone-500">
            {params.status || params.q
              ? "Try adjusting your filters"
              : "Add products to manage inventory"}
          </p>
        </div>
      ) : (
        <InventoryTable products={productList} />
      )}
    </div>
  );
}
