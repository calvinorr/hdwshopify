import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { desc, eq, like, or, and, sql } from "drizzle-orm";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrdersList } from "./orders-list";

interface SearchParams {
  status?: string;
  payment?: string;
  q?: string;
  page?: string;
}

const ORDER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
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
        <OrdersList orders={orderList} />
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
