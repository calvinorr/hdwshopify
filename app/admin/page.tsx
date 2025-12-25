import { db } from "@/lib/db";
import { products, productVariants, categories, orders } from "@/lib/db/schema";
import { count, sum, eq, lt } from "drizzle-orm";
import { Package, FolderTree, AlertTriangle, ShoppingCart } from "lucide-react";
import Link from "next/link";

async function getStats() {
  const [productCount] = await db
    .select({ count: count() })
    .from(products);

  const [variantCount] = await db
    .select({ count: count() })
    .from(productVariants);

  const [categoryCount] = await db
    .select({ count: count() })
    .from(categories);

  const [lowStockCount] = await db
    .select({ count: count() })
    .from(productVariants)
    .where(lt(productVariants.stock, 5));

  const [activeProductCount] = await db
    .select({ count: count() })
    .from(products)
    .where(eq(products.status, "active"));

  return {
    products: productCount.count,
    variants: variantCount.count,
    categories: categoryCount.count,
    lowStock: lowStockCount.count,
    activeProducts: activeProductCount.count,
  };
}

async function getRecentProducts() {
  const recentProducts = await db.query.products.findMany({
    limit: 5,
    orderBy: (products, { desc }) => [desc(products.updatedAt)],
    with: {
      variants: true,
      images: {
        limit: 1,
      },
    },
  });

  return recentProducts;
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const recentProducts = await getRecentProducts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-semibold text-stone-900">
          Dashboard
        </h1>
        <p className="text-stone-600 mt-1">
          Welcome to your store admin
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={stats.products}
          subtitle={`${stats.activeProducts} active`}
          icon={Package}
          href="/admin/products"
        />
        <StatCard
          title="Variants"
          value={stats.variants}
          subtitle="Across all products"
          icon={Package}
          href="/admin/products"
        />
        <StatCard
          title="Collections"
          value={stats.categories}
          subtitle="Product categories"
          icon={FolderTree}
          href="/admin/collections"
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStock}
          subtitle="Items below 5 units"
          icon={AlertTriangle}
          href="/admin/inventory"
          alert={stats.lowStock > 0}
        />
      </div>

      {/* Recent products */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-heading font-medium text-stone-900">
            Recent Products
          </h2>
          <Link
            href="/admin/products"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="divide-y">
          {recentProducts.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              No products yet.{" "}
              <Link href="/admin/products/new" className="text-primary hover:underline">
                Add your first product
              </Link>
            </div>
          ) : (
            recentProducts.map((product) => (
              <Link
                key={product.id}
                href={`/admin/products/${product.id}`}
                className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors"
              >
                {/* Image */}
                <div className="h-12 w-12 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                  {product.images[0] ? (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-stone-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 truncate">
                    {product.name}
                  </p>
                  <p className="text-sm text-stone-500">
                    {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""} · £
                    {product.basePrice.toFixed(2)}
                  </p>
                </div>

                {/* Status */}
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    product.status === "active"
                      ? "bg-green-100 text-green-700"
                      : product.status === "draft"
                      ? "bg-stone-100 text-stone-600"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {product.status}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickAction
          title="Add Product"
          description="Create a new product listing"
          href="/admin/products/new"
          icon={Package}
        />
        <QuickAction
          title="Import from Shopify"
          description="Sync products from your Shopify store"
          href="/admin/settings/import"
          icon={ShoppingCart}
        />
        <QuickAction
          title="Manage Collections"
          description="Organize products into collections"
          href="/admin/collections"
          icon={FolderTree}
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  alert,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-stone-600">{title}</p>
          <p className="text-2xl font-semibold text-stone-900 mt-1">{value}</p>
          <p className="text-xs text-stone-500 mt-1">{subtitle}</p>
        </div>
        <div
          className={`p-2 rounded-lg ${
            alert ? "bg-amber-100" : "bg-stone-100"
          }`}
        >
          <Icon
            className={`h-5 w-5 ${alert ? "text-amber-600" : "text-stone-600"}`}
          />
        </div>
      </div>
    </Link>
  );
}

function QuickAction({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
    >
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-medium text-stone-900">{title}</p>
        <p className="text-sm text-stone-500">{description}</p>
      </div>
    </Link>
  );
}
