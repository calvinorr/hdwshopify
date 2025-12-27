"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCcw,
  CreditCard,
  MapPin,
  Mail,
  User,
  Tag,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OrderItem {
  id: number;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantity: number;
  price: number;
  weightGrams: number | null;
}

interface Customer {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
}

interface DiscountCode {
  id: number;
  code: string;
  type: string;
  value: number;
}

interface Order {
  id: number;
  orderNumber: string;
  email: string;
  status: string | null;
  paymentStatus: string | null;
  subtotal: number;
  shippingCost: number;
  discountAmount: number | null;
  taxAmount: number | null;
  total: number;
  currency: string | null;
  shippingMethod: string | null;
  shippingAddress: string;
  billingAddress: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  customerNotes: string | null;
  internalNotes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: OrderItem[];
  customer: Customer | null;
  discountCode: DiscountCode | null;
}

interface Props {
  order: Order;
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

function parseAddress(addressJson: string) {
  try {
    return JSON.parse(addressJson);
  } catch {
    return null;
  }
}

export function OrderDetail({ order }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [status, setStatus] = useState(order.status || "pending");
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus || "pending");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl || "");
  const [internalNotes, setInternalNotes] = useState(order.internalNotes || "");

  const currentStatus = ORDER_STATUSES.find((s) => s.value === status);
  const currentPayment = PAYMENT_STATUSES.find((s) => s.value === paymentStatus);
  const shippingAddress = parseAddress(order.shippingAddress);
  const billingAddress = order.billingAddress ? parseAddress(order.billingAddress) : null;

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          paymentStatus,
          trackingNumber: trackingNumber || null,
          trackingUrl: trackingUrl || null,
          internalNotes: internalNotes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update order");
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-heading font-semibold text-stone-900">
                Order #{order.orderNumber}
              </h1>
              <button
                type="button"
                onClick={copyOrderNumber}
                className="text-stone-400 hover:text-stone-600"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-stone-500 text-sm mt-1">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/orders">Back</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Order updated successfully!
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order items */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="font-medium text-stone-900">Order Items</h2>
            </div>
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="h-16 w-16 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-6 w-6 text-stone-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-stone-900">{item.productName}</h3>
                    {item.variantName && (
                      <p className="text-sm text-stone-500">{item.variantName}</p>
                    )}
                    {item.sku && (
                      <p className="text-xs text-stone-400 font-mono">SKU: {item.sku}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-stone-500">Qty: {item.quantity}</p>
                    <p className="font-medium text-stone-900">
                      {formatCurrency(item.price * item.quantity, order.currency || "GBP")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="px-6 py-4 bg-stone-50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Subtotal</span>
                <span>{formatCurrency(order.subtotal, order.currency || "GBP")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Shipping</span>
                <span>{formatCurrency(order.shippingCost, order.currency || "GBP")}</span>
              </div>
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Discount
                    {order.discountCode && (
                      <code className="text-xs bg-green-100 px-1 rounded">
                        {order.discountCode.code}
                      </code>
                    )}
                  </span>
                  <span>-{formatCurrency(order.discountAmount, order.currency || "GBP")}</span>
                </div>
              )}
              {order.taxAmount && order.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Tax</span>
                  <span>{formatCurrency(order.taxAmount, order.currency || "GBP")}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-lg pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(order.total, order.currency || "GBP")}</span>
              </div>
            </div>
          </div>

          {/* Shipping & Tracking */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900 flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping & Tracking
            </h2>

            {order.shippingMethod && (
              <div className="text-sm">
                <span className="text-stone-500">Method: </span>
                <span className="font-medium">{order.shippingMethod}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g., RM123456789GB"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trackingUrl">Tracking URL</Label>
                <Input
                  id="trackingUrl"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            {trackingUrl && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View tracking
              </a>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Notes</h2>

            {order.customerNotes && (
              <div className="space-y-1">
                <Label className="text-xs text-stone-500">Customer Notes</Label>
                <p className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
                  {order.customerNotes}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="internalNotes">Internal Notes</Label>
              <Textarea
                id="internalNotes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add private notes about this order..."
                rows={3}
              />
              <p className="text-xs text-stone-500">
                Only visible to staff, not the customer
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Order Status</h2>

            <div className="space-y-2">
              <Label>Fulfillment Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Payment Status</Label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              {currentStatus && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${currentStatus.color}`}>
                  <currentStatus.icon className="h-3 w-3" />
                  {currentStatus.label}
                </span>
              )}
              {currentPayment && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${currentPayment.color}`}>
                  <CreditCard className="h-3 w-3" />
                  {currentPayment.label}
                </span>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer
            </h2>

            <div className="space-y-3">
              {order.customer ? (
                <div>
                  <p className="font-medium text-stone-900">
                    {order.customer.firstName} {order.customer.lastName}
                  </p>
                  <a
                    href={`mailto:${order.customer.email}`}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    {order.customer.email}
                  </a>
                  {order.customer.phone && (
                    <p className="text-sm text-stone-500">{order.customer.phone}</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-stone-500">Guest checkout</p>
                  <a
                    href={`mailto:${order.email}`}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    {order.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </h2>

            {shippingAddress ? (
              <address className="text-sm text-stone-600 not-italic space-y-1">
                <p className="font-medium text-stone-900">
                  {shippingAddress.firstName} {shippingAddress.lastName}
                </p>
                {shippingAddress.company && <p>{shippingAddress.company}</p>}
                <p>{shippingAddress.line1}</p>
                {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                <p>
                  {shippingAddress.city}
                  {shippingAddress.state && `, ${shippingAddress.state}`}{" "}
                  {shippingAddress.postalCode}
                </p>
                <p>{shippingAddress.country}</p>
              </address>
            ) : (
              <p className="text-sm text-stone-500">No address on file</p>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Timeline</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Created</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Updated</span>
                  <span>{formatDate(order.updatedAt)}</span>
                </div>
              )}
              {order.shippedAt && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Shipped</span>
                  <span>{formatDate(order.shippedAt)}</span>
                </div>
              )}
              {order.deliveredAt && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Delivered</span>
                  <span>{formatDate(order.deliveredAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
