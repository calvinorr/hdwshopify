import Link from "next/link";
import { Package, ArrowRight, Search } from "lucide-react";
import { getCurrentCustomer, getClerkUser } from "@/lib/auth";
import { db, orders } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatPrice(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "shipped":
      return "bg-purple-100 text-purple-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
    case "refunded":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getPaymentStatusColor(status: string) {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
    case "refunded":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function OrdersPage() {
  const [customer, clerkUser] = await Promise.all([
    getCurrentCustomer(),
    getClerkUser(),
  ]);

  // Get all orders for this customer
  let customerOrders: (typeof orders.$inferSelect)[] = [];
  if (customer) {
    customerOrders = await db.query.orders.findMany({
      where: eq(orders.customerId, customer.id),
      orderBy: [desc(orders.createdAt)],
    });
  } else if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
    // Fallback: find orders by email
    customerOrders = await db.query.orders.findMany({
      where: eq(orders.email, clerkUser.emailAddresses[0].emailAddress.toLowerCase()),
      orderBy: [desc(orders.createdAt)],
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl text-stone-900">Order History</h2>
        <p className="text-stone-600 mt-1">
          View and track all your past orders.
        </p>
      </div>

      {customerOrders.length === 0 ? (
        <div className="text-center py-16 bg-stone-50 rounded-lg border border-dashed border-stone-200">
          <Package className="h-16 w-16 mx-auto text-stone-300 mb-4" />
          <p className="text-stone-600 font-medium text-lg">No orders yet</p>
          <p className="text-stone-500 mt-1 max-w-sm mx-auto">
            When you place an order, it will appear here so you can track its
            progress.
          </p>
          <Button asChild className="mt-6">
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {customerOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
        <div className="flex items-start gap-3">
          <Search className="h-5 w-5 text-stone-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-stone-700">
              Looking for a specific order?
            </p>
            <p className="text-sm text-stone-500 mt-1">
              If you placed an order as a guest, you can track it using the link
              in your confirmation email or by entering your order number on the{" "}
              <Link href="/order/track" className="text-stone-900 underline">
                order tracking page
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: typeof orders.$inferSelect }) {
  const shippingAddress = order.shippingAddress
    ? JSON.parse(order.shippingAddress)
    : null;

  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="block bg-white border border-stone-200 rounded-lg hover:border-stone-300 hover:shadow-sm transition-all"
    >
      {/* Order Header */}
      <div className="p-4 border-b border-stone-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-heading text-lg text-stone-900">
              {order.orderNumber}
            </span>
            <Badge
              variant="secondary"
              className={getStatusColor(order.status ?? "pending")}
            >
              {order.status}
            </Badge>
            <Badge
              variant="secondary"
              className={getPaymentStatusColor(order.paymentStatus ?? "pending")}
            >
              {order.paymentStatus}
            </Badge>
          </div>
          <span className="text-sm text-stone-500">
            {order.createdAt &&
              format(new Date(order.createdAt), "d MMM yyyy")}
          </span>
        </div>
      </div>

      {/* Order Details */}
      <div className="p-4">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-stone-500">Shipping to</p>
            <p className="text-sm text-stone-700">
              {shippingAddress?.city}, {shippingAddress?.country}
            </p>
          </div>

          {order.trackingNumber && (
            <div className="space-y-1">
              <p className="text-sm text-stone-500">Tracking</p>
              <p className="text-sm text-stone-700 font-mono">
                {order.trackingNumber}
              </p>
            </div>
          )}

          <div className="space-y-1 text-right">
            <p className="text-sm text-stone-500">Total</p>
            <p className="text-lg font-medium text-stone-900">
              {formatPrice(order.total)}
            </p>
          </div>
        </div>
      </div>

      {/* View Details Arrow */}
      <div className="px-4 pb-4 flex justify-end">
        <span className="text-sm text-stone-500 flex items-center gap-1">
          View details
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
