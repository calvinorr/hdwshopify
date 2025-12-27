"use client";

import { useEffect } from "react";

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
}

interface Order {
  id: number;
  orderNumber: string;
  email: string;
  status: string | null;
  subtotal: number;
  shippingCost: number;
  discountAmount: number | null;
  total: number;
  shippingMethod: string | null;
  shippingAddress: string;
  customerNotes: string | null;
  createdAt: string | null;
  items: OrderItem[];
  customer: Customer | null;
}

interface PackingSlipProps {
  order: Order;
}

function parseAddress(addressJson: string) {
  try {
    return JSON.parse(addressJson);
  } catch {
    return null;
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PackingSlip({ order }: PackingSlipProps) {
  const shippingAddress = parseAddress(order.shippingAddress);

  // Auto-print when page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        @media screen {
          body {
            background: #f0f0f0;
            padding: 20px;
          }
        }
      `}</style>

      <div className="max-w-[210mm] mx-auto bg-white p-8 shadow-lg print:shadow-none print:p-0">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-stone-200">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-wide">
              Herbarium Dyeworks
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Naturally Dyed Yarn from Northern Ireland
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-stone-500">Packing Slip</p>
            <p className="text-xl font-bold text-stone-900">#{order.orderNumber}</p>
            <p className="text-sm text-stone-500 mt-1">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              Ship To
            </h2>
            {shippingAddress ? (
              <address className="text-sm text-stone-700 not-italic leading-relaxed">
                <p className="font-semibold text-stone-900">
                  {shippingAddress.name || `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim()}
                </p>
                {shippingAddress.company && <p>{shippingAddress.company}</p>}
                <p>{shippingAddress.line1}</p>
                {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                <p>
                  {shippingAddress.city}
                  {shippingAddress.state && `, ${shippingAddress.state}`}{" "}
                  {shippingAddress.postalCode || shippingAddress.postal_code}
                </p>
                <p>{shippingAddress.country}</p>
              </address>
            ) : (
              <p className="text-sm text-stone-500">No address on file</p>
            )}
          </div>

          <div>
            <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              Order Details
            </h2>
            <div className="text-sm text-stone-700 space-y-1">
              <p>
                <span className="text-stone-500">Email: </span>
                {order.email}
              </p>
              {order.shippingMethod && (
                <p>
                  <span className="text-stone-500">Shipping: </span>
                  {order.shippingMethod}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-stone-200">
              <th className="text-left py-3 text-xs font-bold text-stone-500 uppercase tracking-wider">
                Item
              </th>
              <th className="text-left py-3 text-xs font-bold text-stone-500 uppercase tracking-wider w-24">
                SKU
              </th>
              <th className="text-center py-3 text-xs font-bold text-stone-500 uppercase tracking-wider w-20">
                Qty
              </th>
              <th className="text-center py-3 text-xs font-bold text-stone-500 uppercase tracking-wider w-20">
                Packed
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-stone-100">
                <td className="py-4">
                  <p className="font-medium text-stone-900">{item.productName}</p>
                  {item.variantName && item.variantName !== item.productName && (
                    <p className="text-sm text-stone-500">{item.variantName}</p>
                  )}
                </td>
                <td className="py-4 text-sm text-stone-500 font-mono">
                  {item.sku || "-"}
                </td>
                <td className="py-4 text-center text-lg font-bold text-stone-900">
                  {item.quantity}
                </td>
                <td className="py-4 text-center">
                  <div className="w-6 h-6 border-2 border-stone-300 rounded mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Customer Notes */}
        {order.customerNotes && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h2 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
              Customer Notes
            </h2>
            <p className="text-sm text-amber-900">{order.customerNotes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-stone-200 text-center">
          <p className="text-sm text-stone-500">
            Thank you for supporting small-batch, naturally dyed yarn!
          </p>
          <p className="text-xs text-stone-400 mt-2">
            herbarium-dyeworks.com • hello@herbarium-dyeworks.com
          </p>
        </div>

        {/* Print button (hidden when printing) */}
        <div className="mt-8 text-center print:hidden">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            Print Packing Slip
          </button>
          <button
            onClick={() => window.close()}
            className="ml-4 px-6 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
