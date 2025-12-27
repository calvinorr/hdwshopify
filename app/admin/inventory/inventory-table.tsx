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
  Minus,
  Plus,
  Settings,
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

  // Individual edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Bulk action state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<"increment" | "decrement" | "set">("increment");
  const [bulkValue, setBulkValue] = useState("1");
  const [bulkSaving, setBulkSaving] = useState(false);

  // Selection handlers
  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === variants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(variants.map((v) => v.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Individual edit handlers
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

  // Bulk action handlers
  const openBulkModal = () => {
    setBulkOperation("increment");
    setBulkValue("1");
    setShowBulkModal(true);
  };

  const closeBulkModal = () => {
    setShowBulkModal(false);
  };

  const executeBulkAction = async () => {
    setBulkSaving(true);

    try {
      const response = await fetch("/api/admin/inventory/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantIds: Array.from(selectedIds),
          operation: bulkOperation,
          value: parseInt(bulkValue) || 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update stock");
      }

      setShowBulkModal(false);
      setSelectedIds(new Set());
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update stock");
    } finally {
      setBulkSaving(false);
    }
  };

  // Get selected variants for confirmation
  const selectedVariants = variants.filter((v) => selectedIds.has(v.id));

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-primary">
              {selectedIds.size} variant{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              className="text-primary hover:text-primary"
            >
              Clear selection
            </Button>
          </div>
          <Button size="sm" onClick={openBulkModal}>
            <Settings className="h-4 w-4 mr-2" />
            Adjust Stock
          </Button>
        </div>
      )}

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">
              Bulk Stock Adjustment
            </h3>

            {/* Operation selector */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Operation
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkOperation("increment")}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      bulkOperation === "increment"
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkOperation("decrement")}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      bulkOperation === "decrement"
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    <Minus className="h-4 w-4" />
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkOperation("set")}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      bulkOperation === "set"
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    Set to
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  {bulkOperation === "set" ? "New stock value" : "Amount"}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Affected variants preview */}
            <div className="mb-6">
              <p className="text-sm font-medium text-stone-700 mb-2">
                Affected variants ({selectedVariants.length}):
              </p>
              <div className="max-h-40 overflow-y-auto bg-stone-50 rounded-lg p-3">
                {selectedVariants.slice(0, 10).map((v) => (
                  <div key={v.id} className="text-sm text-stone-600 py-1">
                    {v.product.name} - {v.name}
                    <span className="text-stone-400 ml-2">
                      (current: {v.stock ?? 0})
                    </span>
                  </div>
                ))}
                {selectedVariants.length > 10 && (
                  <div className="text-sm text-stone-400 py-1">
                    ... and {selectedVariants.length - 10} more
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={closeBulkModal}
                disabled={bulkSaving}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={executeBulkAction}
                disabled={bulkSaving}
                className="flex-1"
              >
                {bulkSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Apply Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b">
            <tr>
              {/* Select All Checkbox */}
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === variants.length && variants.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary"
                />
              </th>
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
              const isSelected = selectedIds.has(variant.id);

              return (
                <tr
                  key={variant.id}
                  className={`hover:bg-stone-50 ${isSelected ? "bg-primary/5" : ""}`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(variant.id)}
                      className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary"
                    />
                  </td>

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
    </div>
  );
}
