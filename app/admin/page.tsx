import { db } from "@/lib/db";
import { products, orders } from "@/lib/db/schema";
import { count, sum, eq, lt, and, gte, inArray } from "drizzle-orm";
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  PoundSterling,
  Clock,
  TrendingUp,
  Truck
} from "lucide-react";
import Link from "next/link";

async function getStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    todayOrders,
    todayRevenue,
    monthRevenue,
    pendingOrders,
    lowStockCount,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, todayStart.toISOString()),
          eq(orders.paymentStatus, "paid")
        )
      ),

    db
      .select({ total: sum(orders.total) })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, todayStart.toISOString()),
          eq(orders.paymentStatus, "paid")
        )
      ),

    db
      .select({ total: sum(orders.total) })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, monthStart.toISOString()),
          eq(orders.paymentStatus, "paid")
        )
      ),

    db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          eq(orders.paymentStatus, "paid"),
          inArray(orders.status, ["pending", "processing"])
        )
      ),

    db
      .select({ count: count() })
      .from(products)
      .where(lt(products.stock, 5)),
  ]);

  return {
    todayOrders: todayOrders[0].count,
    todayRevenue: Number(todayRevenue[0].total) || 0,
    monthRevenue: Number(monthRevenue[0].total) || 0,
    pendingOrders: pendingOrders[0].count,
    lowStock: lowStockCount[0].count,
  };
}

async function getPendingOrders() {
  const pendingOrders = await db.query.orders.findMany({
    where: and(
      eq(orders.paymentStatus, "paid"),
      inArray(orders.status, ["pending", "processing"])
    ),
    orderBy: (orders, { asc }) => [asc(orders.createdAt)],
    limit: 5,
  });

  return pendingOrders;
}

async function getLowStockItems() {
  const lowStockProducts = await db.query.products.findMany({
    where: lt(products.stock, 5),
    orderBy: (p, { asc }) => [asc(p.stock)],
    limit: 5,
  });

  return lowStockProducts;
}

function getOrderUrgency(createdAt: string): { level: "normal" | "warning" | "urgent"; days: number } {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days >= 5) return { level: "urgent", days };
  if (days >= 2) return { level: "warning", days };
  return { level: "normal", days };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export default async function AdminDashboard() {
  const [stats, pendingOrders, lowStockItems] = await Promise.all([
    getStats(),
    getPendingOrders(),
    getLowStockItems(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold text-stone-900">
          Dashboard
        </h1>
        <p className="text-stone-600 mt-1">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Orders Today"
          value={stats.todayOrders.toString()}
          icon={ShoppingCart}
          href="/admin/orders"
        />
        <StatCard
          title="Revenue Today"
          value={formatCurrency(stats.todayRevenue)}
          icon={PoundSterling}
          href="/admin/orders"
        />
        <StatCard
          title="Revenue This Month"
          value={formatCurrency(stats.monthRevenue)}
          icon={TrendingUp}
          href="/admin/orders"
        />
        <StatCard
          title="Pending Fulfillment"
          value={stats.pendingOrders.toString()}
          icon={Truck}
          href="/admin/orders?status=pending"
          alert={stats.pendingOrders > 0}
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStock.toString()}
          icon={AlertTriangle}
          href="/admin/inventory"
          alert={stats.lowStock > 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-heading font-medium text-stone-900">
              Orders Needing Attention
            </h2>
            <Link
              href="/admin/orders"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y">
            {pendingOrders.length === 0 ? (
              <div className="p-8 text-center text-stone-500">
                <Truck className="h-8 w-8 mx-auto mb-2 text-stone-300" />
                <p>All caught up! No orders pending.</p>
              </div>
            ) : (
              pendingOrders.map((order) => {
                const urgency = getOrderUrgency(order.createdAt!);
                const shippingAddress = JSON.parse(order.shippingAddress);

                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors"
                  >
                    <div
                      className={`flex-shrink-0 w-1 h-12 rounded-full ${
                        urgency.level === "urgent"
                          ? "bg-red-500"
                          : urgency.level === "warning"
                          ? "bg-amber-500"
                          : "bg-green-500"
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-stone-900">
                          #{order.orderNumber}
                        </p>
                        <span className="text-stone-400">·</span>
                        <p className="text-stone-600 truncate">
                          {shippingAddress.firstName} {shippingAddress.lastName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-stone-500">
                        <span>{formatCurrency(order.total)}</span>
                        <span className="text-stone-400">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {urgency.days === 0
                            ? "Today"
                            : urgency.days === 1
                            ? "1 day ago"
                            : `${urgency.days} days ago`}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex-shrink-0 px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Ship
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-heading font-medium text-stone-900">
              Low Stock Items
            </h2>
            <Link
              href="/admin/inventory"
              className="text-sm text-primary hover:underline"
            >
              View inventory
            </Link>
          </div>
          <div className="divide-y">
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-stone-500">
                <Package className="h-8 w-8 mx-auto mb-2 text-stone-300" />
                <p>Stock levels looking good!</p>
              </div>
            ) : (
              lowStockItems.map((product) => (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors"
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-semibold ${
                      (product.stock ?? 0) === 0
                        ? "bg-red-100 text-red-700"
                        : (product.stock ?? 0) <= 2
                        ? "bg-amber-100 text-amber-700"
                        : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {product.stock ?? 0}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-stone-500 truncate">
                      {product.sku || "No SKU"}
                    </p>
                  </div>

                  <span
                    className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${
                      (product.stock ?? 0) === 0
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {(product.stock ?? 0) === 0 ? "Out of stock" : "Low stock"}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickAction
          title="Add Product"
          description="Create a new product listing"
          href="/admin/products/new"
          icon={Package}
        />
        <QuickAction
          title="View All Orders"
          description="Manage orders and fulfillment"
          href="/admin/orders"
          icon={ShoppingCart}
        />
        <QuickAction
          title="Manage Inventory"
          description="Check and update stock levels"
          href="/admin/inventory"
          icon={AlertTriangle}
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  alert,
}: {
  title: string;
  value: string;
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
