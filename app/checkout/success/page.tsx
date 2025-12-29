import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { CheckCircle, Package, Mail, ArrowRight } from "lucide-react";
import { stripe } from "@/lib/stripe";
import { db, orders, orderItems } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-price";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<SuccessPageSkeleton />}>
      <SuccessContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SuccessContent({ searchParams }: Props) {
  const params = await searchParams;
  const sessionId = params.session_id;

  if (!sessionId) {
    redirect("/");
  }

  // Verify the session with Stripe
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "shipping_cost.shipping_rate"],
    });
  } catch {
    notFound();
  }

  if (session.payment_status !== "paid") {
    redirect("/cart");
  }

  // Get order from database
  const order = await db.query.orders.findFirst({
    where: eq(orders.stripeSessionId, sessionId),
    with: {
      items: true,
    },
  });

  // Parse shipping address
  const shippingAddress = order?.shippingAddress
    ? JSON.parse(order.shippingAddress)
    : null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="font-heading text-3xl mb-2">Thank You for Your Order!</h1>
          <p className="text-muted-foreground font-body">
            Your order has been confirmed and is being prepared.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          {order && (
            <>
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-border">
                <div>
                  <p className="text-sm text-muted-foreground font-body">Order Number</p>
                  <p className="text-xl font-heading">{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground font-body">Order Total</p>
                  <p className="text-xl font-heading">{formatPrice(order.total)}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-heading text-lg mb-3">Items Ordered</h3>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center py-2 border-b border-border/50 last:border-0"
                    >
                      <div>
                        <p className="font-body">{item.productName}</p>
                        {item.colorway && item.colorway !== item.productName && (
                          <p className="text-sm text-muted-foreground font-body">
                            {item.colorway}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-body">
                          {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-2 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between font-body text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between font-body text-sm">
                  <span>Shipping ({order.shippingMethod})</span>
                  <span>
                    {order.shippingCost === 0
                      ? "Free"
                      : formatPrice(order.shippingCost)}
                  </span>
                </div>
                {(order.discountAmount ?? 0) > 0 && (
                  <div className="flex justify-between font-body text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discountAmount!)}</span>
                  </div>
                )}
                <div className="flex justify-between font-heading text-lg pt-2">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>

              {/* Shipping Address */}
              {shippingAddress && (
                <div className="mb-6">
                  <h3 className="font-heading text-lg mb-2">Shipping To</h3>
                  <address className="font-body text-muted-foreground not-italic">
                    {shippingAddress.name}
                    <br />
                    {shippingAddress.line1}
                    {shippingAddress.line2 && (
                      <>
                        <br />
                        {shippingAddress.line2}
                      </>
                    )}
                    <br />
                    {shippingAddress.city}, {shippingAddress.postalCode}
                    <br />
                    {shippingAddress.country}
                  </address>
                </div>
              )}
            </>
          )}

          {/* Email Confirmation */}
          <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-lg">
            <Mail className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-body text-sm">
                A confirmation email has been sent to{" "}
                <strong>{session.customer_details?.email}</strong>
              </p>
              <p className="font-body text-sm text-muted-foreground mt-1">
                You&apos;ll receive shipping updates when your order is dispatched.
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h3 className="font-heading text-lg mb-4">What Happens Next?</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-heading text-sm">1</span>
              </div>
              <div>
                <p className="font-body font-medium">Order Confirmation</p>
                <p className="font-body text-sm text-muted-foreground">
                  We&apos;re preparing your order with care
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-heading text-sm">2</span>
              </div>
              <div>
                <p className="font-body font-medium">Shipping Notification</p>
                <p className="font-body text-sm text-muted-foreground">
                  You&apos;ll receive tracking details when dispatched
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-body font-medium">Delivery</p>
                <p className="font-body text-sm text-muted-foreground">
                  Your beautiful yarn arrives at your door
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline">
            <Link href="/products">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function SuccessPageSkeleton() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full animate-pulse mb-4" />
          <div className="h-8 w-64 bg-muted rounded mx-auto mb-2 animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded mx-auto animate-pulse" />
        </div>
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
