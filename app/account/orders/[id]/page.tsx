import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Truck, CheckCircle, ExternalLink } from "lucide-react";
import { getCurrentCustomer, getClerkUser } from "@/lib/auth";
import { db, orders, orderItems } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface PageProps {
  params: Promise<{ id: string }>;
}

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

const statusSteps = [
  { status: "pending", label: "Order Placed", icon: Package },
  { status: "processing", label: "Processing", icon: Package },
  { status: "shipped", label: "Shipped", icon: Truck },
  { status: "delivered", label: "Delivered", icon: CheckCircle },
];

function getStatusIndex(status: string): number {
  if (status === "cancelled" || status === "refunded") return -1;
  return statusSteps.findIndex((s) => s.status === status);
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId)) {
    notFound();
  }

  const [customer, clerkUser] = await Promise.all([
    getCurrentCustomer(),
    getClerkUser(),
  ]);

  // Get the order
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  // Verify ownership
  const customerEmail = customer?.email || clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  const isOwner =
    (customer && order.customerId === customer.id) ||
    (customerEmail && order.email.toLowerCase() === customerEmail);

  if (!isOwner) {
    notFound();
  }

  const shippingAddress = order.shippingAddress
    ? JSON.parse(order.shippingAddress)
    : null;

  const currentStatusIndex = getStatusIndex(order.status ?? "pending");
  const isCancelledOrRefunded = order.status === "cancelled" || order.status === "refunded";

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      {/* Order Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl text-stone-900">
            Order {order.orderNumber}
          </h2>
          <p className="text-stone-500 mt-1">
            Placed on{" "}
            {order.createdAt && format(new Date(order.createdAt), "d MMMM yyyy")}
          </p>
        </div>
        <Badge
          variant="secondary"
          className={`${getStatusColor(order.status ?? "pending")} text-base px-3 py-1`}
        >
          {order.status}
        </Badge>
      </div>

      {/* Status Timeline */}
      {!isCancelledOrRefunded && (
        <div className="bg-stone-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const Icon = step.icon;

              return (
                <div key={step.status} className="flex-1 relative">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${isCompleted ? "bg-green-500 text-white" : "bg-stone-200 text-stone-400"}
                        ${isCurrent ? "ring-4 ring-green-100" : ""}
                      `}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`
                        mt-2 text-xs font-medium
                        ${isCompleted ? "text-stone-900" : "text-stone-400"}
                      `}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector Line */}
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`
                        absolute top-5 left-1/2 w-full h-0.5
                        ${index < currentStatusIndex ? "bg-green-500" : "bg-stone-200"}
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled/Refunded Notice */}
      {isCancelledOrRefunded && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            This order has been {order.status}. If you have any questions, please
            contact us.
          </p>
        </div>
      )}

      {/* Tracking Info */}
      {order.trackingNumber && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Tracking Number
              </p>
              <p className="text-blue-800 font-mono mt-1">
                {order.trackingNumber}
              </p>
            </div>
            {order.trackingUrl && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  Track Package
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-heading text-lg text-stone-900">Items</h3>
          <div className="border border-stone-200 rounded-lg divide-y divide-stone-100">
            {order.items.map((item) => (
              <div key={item.id} className="p-4 flex gap-4">
                <div className="flex-1">
                  <p className="font-medium text-stone-900">{item.productName}</p>
                  {item.colorway && item.colorway !== item.productName && (
                    <p className="text-sm text-stone-500">{item.colorway}</p>
                  )}
                  <p className="text-sm text-stone-500 mt-1">
                    Qty: {item.quantity}
                  </p>
                </div>
                <p className="font-medium text-stone-900">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="border border-stone-200 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">Subtotal</span>
              <span className="text-stone-900">{formatPrice(order.subtotal)}</span>
            </div>
            {order.discountAmount && order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Discount</span>
                <span className="text-green-600">
                  -{formatPrice(order.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">
                Shipping ({order.shippingMethod || "Standard"})
              </span>
              <span className="text-stone-900">
                {order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-medium text-lg">
              <span className="text-stone-900">Total</span>
              <span className="text-stone-900">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg text-stone-900">Shipping Address</h3>
          {shippingAddress ? (
            <div className="border border-stone-200 rounded-lg p-4">
              <p className="font-medium text-stone-900">{shippingAddress.name}</p>
              <p className="text-stone-600 mt-1">{shippingAddress.line1}</p>
              {shippingAddress.line2 && (
                <p className="text-stone-600">{shippingAddress.line2}</p>
              )}
              <p className="text-stone-600">
                {shippingAddress.city}
                {shippingAddress.state && `, ${shippingAddress.state}`}{" "}
                {shippingAddress.postalCode}
              </p>
              <p className="text-stone-600">{shippingAddress.country}</p>
            </div>
          ) : (
            <p className="text-stone-500">No shipping address on file.</p>
          )}

          {/* Contact */}
          <div className="space-y-2">
            <h3 className="font-heading text-lg text-stone-900">Contact</h3>
            <div className="border border-stone-200 rounded-lg p-4">
              <p className="text-stone-600">{order.email}</p>
            </div>
          </div>

          {/* Customer Notes */}
          {order.customerNotes && (
            <div className="space-y-2">
              <h3 className="font-heading text-lg text-stone-900">Order Notes</h3>
              <div className="border border-stone-200 rounded-lg p-4">
                <p className="text-stone-600 text-sm">{order.customerNotes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
        <p className="text-sm text-stone-600">
          Need help with this order?{" "}
          <Link href="/contact" className="text-stone-900 underline">
            Contact us
          </Link>{" "}
          and reference order <strong>{order.orderNumber}</strong>.
        </p>
      </div>
    </div>
  );
}
