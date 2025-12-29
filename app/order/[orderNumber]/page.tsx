import { notFound } from "next/navigation";
import Link from "next/link";
import { Package, Truck, CheckCircle, ExternalLink, ArrowLeft } from "lucide-react";
import { db, orders } from "@/lib/db";
import { eq } from "drizzle-orm";
import { format } from "date-fns";
import { verifyOrderToken } from "@/lib/order-token";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { OrderLookupForm } from "./order-lookup-form";

interface PageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ token?: string }>;
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

export default async function GuestOrderPage({ params, searchParams }: PageProps) {
  const { orderNumber } = await params;
  const { token } = await searchParams;

  // Find the order by order number
  const order = await db.query.orders.findFirst({
    where: eq(orders.orderNumber, orderNumber),
    with: {
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  // Verify access via token
  let hasAccess = false;
  if (token) {
    const verified = verifyOrderToken(token);
    if (verified && verified.orderId === order.id && verified.email.toLowerCase() === order.email.toLowerCase()) {
      hasAccess = true;
    }
  }

  // If no valid token, show the lookup form
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-stone-50">
          <div className="container mx-auto px-4 py-12 max-w-md">
            <div className="text-center mb-8">
              <Package className="h-12 w-12 mx-auto text-stone-400 mb-4" />
              <h1 className="font-heading text-2xl text-stone-900">
                Track Your Order
              </h1>
              <p className="text-stone-600 mt-2">
                Enter your email to view order details.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-stone-200 p-6">
              <p className="text-sm text-stone-600 mb-4">
                Order: <strong>{orderNumber}</strong>
              </p>
              <OrderLookupForm orderId={order.id} orderEmail={order.email} />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show full order details
  const shippingAddress = order.shippingAddress
    ? JSON.parse(order.shippingAddress)
    : null;

  const currentStatusIndex = getStatusIndex(order.status ?? "pending");
  const isCancelledOrRefunded = order.status === "cancelled" || order.status === "refunded";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-stone-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Link */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Link>

            <div className="bg-white rounded-lg border border-stone-200 p-6 lg:p-8">
              {/* Order Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="font-heading text-2xl text-stone-900">
                    Order {order.orderNumber}
                  </h1>
                  <p className="text-stone-500 mt-1">
                    Placed on{" "}
                    {order.createdAt &&
                      format(new Date(order.createdAt), "d MMMM yyyy")}
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
                <div className="bg-stone-50 rounded-lg p-6 mb-6">
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
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800">
                    This order has been {order.status}. If you have any questions,
                    please contact us.
                  </p>
                </div>
              )}

              {/* Tracking Info */}
              {order.trackingNumber && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
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
                          <p className="font-medium text-stone-900">
                            {item.productName}
                          </p>
                          {item.colorway &&
                            item.colorway !== item.productName && (
                              <p className="text-sm text-stone-500">
                                {item.colorway}
                              </p>
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
                      <span className="text-stone-900">
                        {formatPrice(order.subtotal)}
                      </span>
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
                        {order.shippingCost === 0
                          ? "Free"
                          : formatPrice(order.shippingCost)}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium text-lg">
                      <span className="text-stone-900">Total</span>
                      <span className="text-stone-900">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="space-y-4">
                  <h3 className="font-heading text-lg text-stone-900">
                    Shipping Address
                  </h3>
                  {shippingAddress ? (
                    <div className="border border-stone-200 rounded-lg p-4">
                      <p className="font-medium text-stone-900">
                        {shippingAddress.name}
                      </p>
                      <p className="text-stone-600 mt-1">
                        {shippingAddress.line1}
                      </p>
                      {shippingAddress.line2 && (
                        <p className="text-stone-600">{shippingAddress.line2}</p>
                      )}
                      <p className="text-stone-600">
                        {shippingAddress.city}
                        {shippingAddress.state &&
                          `, ${shippingAddress.state}`}{" "}
                        {shippingAddress.postalCode}
                      </p>
                      <p className="text-stone-600">{shippingAddress.country}</p>
                    </div>
                  ) : (
                    <p className="text-stone-500">No shipping address on file.</p>
                  )}
                </div>
              </div>

              {/* Help Section */}
              <div className="mt-8 bg-stone-50 rounded-lg p-4 border border-stone-200">
                <p className="text-sm text-stone-600">
                  Need help with this order?{" "}
                  <Link href="/contact" className="text-stone-900 underline">
                    Contact us
                  </Link>{" "}
                  and reference order <strong>{order.orderNumber}</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
