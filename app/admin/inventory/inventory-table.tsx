"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Check,
  X,
  Pencil,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Variant {
  id: number;
  name: string;
  sku: string | null;
  stock: number | null;
  price: number;
  product: {
    id: number;
    name: string;
    slug: string;
    images: { url: string }[];
  };
}

interface Props {
  variants: Variant[];
}

const LOW_STOCK_THRESHOLD = 2;

function getStockStatus(stock: number | null) {
  if (stock === null || stock === 0) {
    return { label: "Out of stock", icon: XCircle, color: "text-red-600 bg-red-50" };
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return { label: "Low stock", icon: AlertTriangle, color: "text-amber-600 bg-amber-50" };
  }
  return { label: "In stock", icon: CheckCircle, color: "text-green-600 bg-green-50" };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export function InventoryTable({ variants }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (variant: Variant) => {
    setEditingId(variant.id);
    setEditValue(variant.stock?.toString() || "0");
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
    setError(null);
  };

  const saveStock = async (variantId: number) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          stock: parseInt(editValue) || 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update stock");
      }

      setEditingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, variantId: number) => {
    if (e.key === "Enter") {
      saveStock(variantId);
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead className="bg-stone-50 border-b">
          <tr>
            <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3">
              Product / Variant
            </th>
            <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
              SKU
            </th>
            <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
              Price
            </th>
            <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3">
              Stock
            </th>
            <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3">
              Status
            </th>
            <th className="w-20 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {variants.map((variant) => {
            const status = getStockStatus(variant.stock);
            const StatusIcon = status.icon;
            const isEditing = editingId === variant.id;

            return (
              <tr key={variant.id} className="hover:bg-stone-50">
                {/* Product / Variant */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                      {variant.product.images[0] ? (
                        <img
                          src={variant.product.images[0].url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-4 w-4 text-stone-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/admin/products/${variant.product.id}`}
                        className="font-medium text-stone-900 hover:text-primary"
                      >
                        {variant.product.name}
                      </Link>
                      <p className="text-sm text-stone-500">{variant.name}</p>
                    </div>
                  </div>
                </td>

                {/* SKU */}
                <td className="px-4 py-4 hidden md:table-cell">
                  {variant.sku ? (
                    <code className="text-xs bg-stone-100 px-2 py-1 rounded font-mono">
                      {variant.sku}
                    </code>
                  ) : (
                    <span className="text-stone-400 text-sm">-</span>
                  )}
                </td>

                {/* Price */}
                <td className="px-4 py-4 hidden sm:table-cell">
                  <span className="text-sm text-stone-900">
                    {formatCurrency(variant.price)}
                  </span>
                </td>

                {/* Stock */}
                <td className="px-4 py-4">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, variant.id)}
                        className="w-20 h-8 text-sm"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => saveStock(variant.id)}
                        disabled={saving}
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-stone-500 hover:text-stone-700"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-stone-900">
                      {variant.stock ?? 0}
                    </span>
                  )}
                  {isEditing && error && (
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${status.color}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    <span className="hidden sm:inline">{status.label}</span>
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-4">
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => startEdit(variant)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
