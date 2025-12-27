import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Calendar,
  User,
  Clock,
  CheckCircle,
  Package,
  Truck,
  CreditCard,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ id: string }>;
}

const ORDER_STATUSES: Record<string, { icon: any; color: string }> = {
  pending: { icon: Clock, color: "bg-amber-100 text-amber-700" },
  processing: { icon: Package, color: "bg-blue-100 text-blue-700" },
  shipped: { icon: Truck, color: "bg-purple-100 text-purple-700" },
  delivered: { icon: CheckCircle, color: "bg-green-100 text-green-700" },
};

async function getCustomer(id: number) {
  return db.query.customers.findFirst({
    where: eq(customers.id, id),
    with: {
      orders: {
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
        with: {
          items: true,
        },
      },
      addresses: true,
    },
  });
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string | null) {
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

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const customerId = parseInt(id);

  if (isNaN(customerId)) {
    notFound();
  }

  const customer = await getCustomer(customerId);

  if (!customer) {
    notFound();
  }

  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Unknown";
  const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0);
  const orderCount = customer.orders.length;
  const defaultAddress = customer.addresses.find((a) => a.isDefault) || customer.addresses[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/customers">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-semibold text-stone-900">
              {fullName}
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Customer since {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <a href={`mailto:${customer.email}`}>
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </a>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-medium text-stone-900 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Orders ({orderCount})
              </h2>
              {orderCount > 0 && (
                <span className="text-sm text-stone-500">
                  Total spent: {formatCurrency(totalSpent)}
                </span>
              )}
            </div>

            {customer.orders.length === 0 ? (
              <div className="p-8 text-center text-stone-500">
                No orders yet
              </div>
            ) : (
              <div className="divide-y">
                {customer.orders.map((order) => {
                  const status = ORDER_STATUSES[order.status || "pending"] || ORDER_STATUSES.pending;
                  const StatusIcon = status.icon;
                  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

                  return (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-stone-900">
                            #{order.orderNumber}
                          </span>
                          <span className="text-sm text-stone-500">
                            {formatDateTime(order.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-sm text-stone-500 hidden sm:block">
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                        </span>
                        <span className="font-medium text-stone-900">
                          {formatCurrency(order.total, order.currency || "GBP")}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {order.status}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Addresses */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="font-medium text-stone-900 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Addresses ({customer.addresses.length})
              </h2>
            </div>

            {customer.addresses.length === 0 ? (
              <div className="p-8 text-center text-stone-500">
                No saved addresses
              </div>
            ) : (
              <div className="grid gap-4 p-6 sm:grid-cols-2">
                {customer.addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`border rounded-lg p-4 ${
                      address.isDefault ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    {address.isDefault && (
                      <span className="inline-flex px-2 py-0.5 text-xs bg-primary text-white rounded mb-2">
                        Default
                      </span>
                    )}
                    <p className="text-xs text-stone-500 uppercase mb-1">
                      {address.type}
                    </p>
                    <address className="text-sm text-stone-600 not-italic space-y-0.5">
                      <p className="font-medium text-stone-900">
                        {address.firstName} {address.lastName}
                      </p>
                      {address.company && <p>{address.company}</p>}
                      <p>{address.line1}</p>
                      {address.line2 && <p>{address.line2}</p>}
                      <p>
                        {address.city}
                        {address.state && `, ${address.state}`} {address.postalCode}
                      </p>
                      <p>{address.country}</p>
                      {address.phone && (
                        <p className="pt-1 text-stone-500">{address.phone}</p>
                      )}
                    </address>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </h2>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-stone-500 uppercase">Email</p>
                <a
                  href={`mailto:${customer.email}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  {customer.email}
                </a>
              </div>

              {customer.phone && (
                <div>
                  <p className="text-xs text-stone-500 uppercase">Phone</p>
                  <a
                    href={`tel:${customer.phone}`}
                    className="text-sm text-stone-900 flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    {customer.phone}
                  </a>
                </div>
              )}

              <div>
                <p className="text-xs text-stone-500 uppercase">Marketing</p>
                <p className="text-sm text-stone-900">
                  {customer.acceptsMarketing ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Subscribed
                    </span>
                  ) : (
                    <span className="text-stone-500">Not subscribed</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Customer Stats</h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-stone-500">Total Orders</span>
                <span className="text-sm font-medium text-stone-900">{orderCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-stone-500">Total Spent</span>
                <span className="text-sm font-medium text-stone-900">
                  {formatCurrency(totalSpent)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-stone-500">Avg. Order Value</span>
                <span className="text-sm font-medium text-stone-900">
                  {orderCount > 0
                    ? formatCurrency(totalSpent / orderCount)
                    : formatCurrency(0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-stone-500">Saved Addresses</span>
                <span className="text-sm font-medium text-stone-900">
                  {customer.addresses.length}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Customer since</span>
                <span>{formatDate(customer.createdAt)}</span>
              </div>
              {customer.updatedAt && customer.updatedAt !== customer.createdAt && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Last updated</span>
                  <span>{formatDate(customer.updatedAt)}</span>
                </div>
              )}
              {customer.orders.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Last order</span>
                  <span>{formatDate(customer.orders[0].createdAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
