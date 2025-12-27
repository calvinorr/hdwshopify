"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCcw,
  CreditCard,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderItem {
  id: number;
  quantity: number;
}

interface Customer {
  firstName: string | null;
  lastName: string | null;
}

interface Order {
  id: number;
  orderNumber: string;
  email: string;
  status: string | null;
  paymentStatus: string | null;
  total: number;
  currency: string | null;
  createdAt: string | null;
  items: OrderItem[];
  customer: Customer | null;
}

interface OrdersListProps {
  orders: Order[];
}

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", icon: Clock, color: "bg-amber-100 text-amber-700" },
  { value: "on-hold", label: "On Hold", icon: Clock, color: "bg-orange-100 text-orange-700" },
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

export function OrdersList({ orders }: OrdersListProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = selectedIds.size === orders.length && orders.length > 0;
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  };

  const toggleOrder = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedIds.size === 0) return;

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/orders/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: Array.from(selectedIds),
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update orders");
      }

      setSelectedIds(new Set());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {someSelected && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} order{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-500 mr-2">Mark as:</span>
            <Button
              size="sm"
              variant="outline"
              disabled={isUpdating}
              onClick={() => handleBulkStatusUpdate("processing")}
            >
              <Package className="h-3 w-3 mr-1" />
              Processing
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isUpdating}
              onClick={() => handleBulkStatusUpdate("shipped")}
            >
              <Truck className="h-3 w-3 mr-1" />
              Shipped
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isUpdating}
              onClick={() => handleBulkStatusUpdate("delivered")}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Delivered
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b">
            <tr>
              <th className="w-10 px-4 py-3">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-stone-400 hover:text-stone-600"
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
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
            {orders.map((order) => {
              const status = ORDER_STATUSES.find((s) => s.value === order.status);
              const payment = PAYMENT_STATUSES.find((s) => s.value === order.paymentStatus);
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
              const isSelected = selectedIds.has(order.id);

              return (
                <tr
                  key={order.id}
                  className={`hover:bg-stone-50 ${isSelected ? "bg-primary/5" : ""}`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => toggleOrder(order.id)}
                      className="text-stone-400 hover:text-stone-600"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>

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
    </div>
  );
}
