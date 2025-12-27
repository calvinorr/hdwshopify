import Link from "next/link";
import { Package, MapPin, ArrowRight } from "lucide-react";
import { getCurrentCustomer, getClerkUser } from "@/lib/auth";
import { db, orders } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export default async function AccountPage() {
  const [customer, clerkUser] = await Promise.all([
    getCurrentCustomer(),
    getClerkUser(),
  ]);

  // Get recent orders for this customer
  let recentOrders: typeof orders.$inferSelect[] = [];
  if (customer) {
    recentOrders = await db.query.orders.findMany({
      where: eq(orders.customerId, customer.id),
      orderBy: [desc(orders.createdAt)],
      limit: 3,
    });
  } else if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
    // Fallback: find orders by email
    recentOrders = await db.query.orders.findMany({
      where: eq(orders.email, clerkUser.emailAddresses[0].emailAddress.toLowerCase()),
      orderBy: [desc(orders.createdAt)],
      limit: 3,
    });
  }

  const displayName =
    customer?.firstName ||
    clerkUser?.firstName ||
    clerkUser?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    "there";

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="font-heading text-2xl text-stone-900">
          Welcome back, {displayName}!
        </h2>
        <p className="text-stone-600 mt-1">
          Manage your orders, addresses, and account settings.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/account/orders"
          className="group p-5 rounded-lg border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-stone-600">
                <Package className="h-5 w-5" />
                <span className="font-medium">Orders</span>
              </div>
              <p className="text-2xl font-heading text-stone-900 mt-2">
                {recentOrders.length > 0 ? `${recentOrders.length}+` : "0"}
              </p>
              <p className="text-sm text-stone-500">View order history</p>
            </div>
            <ArrowRight className="h-5 w-5 text-stone-400 group-hover:text-stone-600 transition-colors" />
          </div>
        </Link>

        <Link
          href="/account/addresses"
          className="group p-5 rounded-lg border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-stone-600">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">Addresses</span>
              </div>
              <p className="text-2xl font-heading text-stone-900 mt-2">
                {customer?.addresses?.length ?? 0}
              </p>
              <p className="text-sm text-stone-500">Manage saved addresses</p>
            </div>
            <ArrowRight className="h-5 w-5 text-stone-400 group-hover:text-stone-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg text-stone-900">Recent Orders</h3>
          {recentOrders.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account/orders">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-12 bg-stone-50 rounded-lg border border-dashed border-stone-200">
            <Package className="h-12 w-12 mx-auto text-stone-300 mb-3" />
            <p className="text-stone-600 font-medium">No orders yet</p>
            <p className="text-stone-500 text-sm mt-1">
              When you place an order, it will appear here.
            </p>
            <Button asChild className="mt-4">
              <Link href="/products">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="block p-4 rounded-lg border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-stone-900">
                        {order.orderNumber}
                      </span>
                      <Badge
                        variant="secondary"
                        className={getStatusColor(order.status ?? "pending")}
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-stone-500 mt-1">
                      {order.createdAt &&
                        formatDistanceToNow(new Date(order.createdAt), {
                          addSuffix: true,
                        })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-stone-900">
                      {formatPrice(order.total)}
                    </p>
                    <ArrowRight className="h-4 w-4 text-stone-400 ml-auto mt-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
