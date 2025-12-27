import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { desc, eq, like, or, and, sql } from "drizzle-orm";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCcw,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchParams {
  status?: string;
  payment?: string;
  q?: string;
  page?: string;
}

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", icon: Clock, color: "bg-amber-100 text-amber-700" },
  { value: "processing", label: "Processing", icon: Package, color: "bg-blue-100 text-blue-700" },
  { value: "shipped", label: "Shipped", icon: Truck, color: "bg-purple-100 text-purple-700" },
  { value: "delivered", label: "Delivered", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  { value: "cancelled", label: "Cancelled", icon: XCircle, color: "bg-stone-100 text-stone-600" },
  { value: "refunded", label: "Refunded", icon: RefreshCcw, color: "bg-red-100 text-red-700" },
];

const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-amber-100 text-amber-700" },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-700" },
  { value: "failed", label: "Failed", color: "bg-red-100 text-red-700" },
  { value: "refunded", label: "Refunded", color: "bg-stone-100 text-stone-600" },
];

async function getOrders(searchParams: SearchParams) {
  const page = parseInt(searchParams.page || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (searchParams.status) {
    conditions.push(eq(orders.status, searchParams.status as any));
  }

  if (searchParams.payment) {
    conditions.push(eq(orders.paymentStatus, searchParams.payment as any));
  }

  if (searchParams.q) {
    const searchTerm = `%${searchParams.q}%`;
    conditions.push(
      or(
        like(orders.orderNumber, searchTerm),
        like(orders.email, searchTerm)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [orderList, countResult] = await Promise.all([
    db.query.orders.findMany({
      where: whereClause,
      orderBy: [desc(orders.createdAt)],
      limit,
      offset,
      with: {
        items: true,
        customer: true,
      },
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereClause),
  ]);

  return {
    orders: orderList,
    total: Number(countResult[0]?.count || 0),
    page,
    limit,
  };
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { orders: orderList, total, page, limit } = await getOrders(params);
  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-stone-900">
            Orders
          </h1>
          <p className="text-stone-600 mt-1">
            {total} order{total !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <form className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Search by order # or email..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Status filter */}
          <select
            name="status"
            defaultValue={params.status}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          {/* Payment filter */}
          <select
            name="payment"
            defaultValue={params.payment}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">All Payments</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <Button type="submit" variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>

          {(params.status || params.payment || params.q) && (
            <Button type="button" variant="ghost" asChild>
              <Link href="/admin/orders">Clear</Link>
            </Button>
          )}
        </form>
      </div>

      {/* Orders list */}
      {orderList.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <ShoppingCart className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-900 mb-2">
            No orders found
          </h3>
          <p className="text-stone-500">
            {params.status || params.payment || params.q
              ? "Try adjusting your filters"
              : "Orders will appear here when customers make purchases"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-stone-50 border-b">
              <tr>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3">
                  Order
                </th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                  Date
                </th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                  Customer
                </th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Items
                </th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3">
                  Total
                </th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                  Payment
                </th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {orderList.map((order) => {
                const status = ORDER_STATUSES.find((s) => s.value === order.status);
                const payment = PAYMENT_STATUSES.find((s) => s.value === order.paymentStatus);
                const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <tr key={order.id} className="hover:bg-stone-50">
                    {/* Order number */}
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-stone-900 hover:text-primary"
                      >
                        #{order.orderNumber}
                      </Link>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="text-sm text-stone-600">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div>
                        {order.customer ? (
                          <span className="text-sm font-medium text-stone-900">
                            {order.customer.firstName} {order.customer.lastName}
                          </span>
                        ) : (
                          <span className="text-sm text-stone-500">Guest</span>
                        )}
                        <p className="text-xs text-stone-500 truncate max-w-[200px]">
                          {order.email}
                        </p>
                      </div>
                    </td>

                    {/* Items */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-sm text-stone-600">
                        {itemCount} item{itemCount !== 1 ? "s" : ""}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-4">
                      <span className="font-medium text-stone-900">
                        {formatCurrency(order.total, order.currency || "GBP")}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      {status && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${status.color}`}
                        >
                          <status.icon className="h-3 w-3" />
                          {status.label}
                        </span>
                      )}
                    </td>

                    {/* Payment */}
                    <td className="px-4 py-4 hidden sm:table-cell">
                      {payment && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${payment.color}`}
                        >
                          <CreditCard className="h-3 w-3" />
                          {payment.label}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-600">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={{
                    pathname: "/admin/orders",
                    query: { ...params, page: page - 1 },
                  }}
                >
                  Previous
                </Link>
              </Button>
            )}
            {page < pages && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={{
                    pathname: "/admin/orders",
                    query: { ...params, page: page + 1 },
                  }}
                >
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
