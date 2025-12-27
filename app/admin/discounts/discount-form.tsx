"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Trash2,
  Percent,
  PoundSterling,
  Calendar,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DiscountCode {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderValue: number | null;
  maxUses: number | null;
  usesCount: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean | null;
}

interface Props {
  discount?: DiscountCode;
  mode: "create" | "edit";
}

export function DiscountForm({ discount, mode }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState(discount?.code || "");
  const [type, setType] = useState<"percentage" | "fixed">(discount?.type || "percentage");
  const [value, setValue] = useState(discount?.value?.toString() || "");
  const [minOrderValue, setMinOrderValue] = useState(
    discount?.minOrderValue?.toString() || ""
  );
  const [maxUses, setMaxUses] = useState(discount?.maxUses?.toString() || "");
  const [startsAt, setStartsAt] = useState(
    discount?.startsAt ? discount.startsAt.slice(0, 16) : ""
  );
  const [expiresAt, setExpiresAt] = useState(
    discount?.expiresAt ? discount.expiresAt.slice(0, 16) : ""
  );
  const [active, setActive] = useState(discount?.active !== false);

  // Generate random code
  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        code: code.toUpperCase().trim(),
        type,
        value: parseFloat(value) || 0,
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        active,
      };

      const url =
        mode === "create"
          ? "/api/admin/discounts"
          : `/api/admin/discounts/${discount?.id}`;

      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save discount");
      }

      router.push("/admin/discounts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this discount code?")) return;

    try {
      const response = await fetch(`/api/admin/discounts/${discount?.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete discount");
      }

      router.push("/admin/discounts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/discounts">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-semibold text-stone-900">
              {mode === "create" ? "Create Discount" : "Edit Discount"}
            </h1>
            {discount && (
              <p className="text-stone-500 text-sm mt-1 font-mono">
                {discount.code}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/discounts">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Discount"}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Code & Type */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Discount Code</h2>

            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., SUMMER20"
                  className="font-mono uppercase"
                  required
                />
                <Button type="button" variant="outline" onClick={generateCode}>
                  <Hash className="h-4 w-4 mr-1" />
                  Generate
                </Button>
              </div>
              <p className="text-xs text-stone-500">
                Customers will enter this code at checkout
              </p>
            </div>

            <div className="space-y-2">
              <Label>Discount Type</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setType("percentage")}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                    type === "percentage"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <Percent className="h-5 w-5" />
                  <span className="font-medium">Percentage</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType("fixed")}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                    type === "fixed"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <PoundSterling className="h-5 w-5" />
                  <span className="font-medium">Fixed Amount</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">
                {type === "percentage" ? "Percentage Off *" : "Amount Off (£) *"}
              </Label>
              <div className="flex items-center gap-2">
                {type === "fixed" && (
                  <span className="text-stone-500">£</span>
                )}
                <Input
                  id="value"
                  type="number"
                  step={type === "percentage" ? "1" : "0.01"}
                  min="0"
                  max={type === "percentage" ? "100" : undefined}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="max-w-32"
                  required
                />
                {type === "percentage" && (
                  <span className="text-stone-500">%</span>
                )}
              </div>
            </div>
          </div>

          {/* Restrictions */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Restrictions</h2>

            <div className="space-y-2">
              <Label htmlFor="minOrderValue">Minimum Order Value</Label>
              <div className="flex items-center gap-2">
                <span className="text-stone-500">£</span>
                <Input
                  id="minOrderValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  placeholder="No minimum"
                  className="max-w-32"
                />
              </div>
              <p className="text-xs text-stone-500">
                Leave empty for no minimum order requirement
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUses">Maximum Uses</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                className="max-w-32"
              />
              <p className="text-xs text-stone-500">
                Leave empty for unlimited uses
              </p>
            </div>
          </div>

          {/* Validity Period */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Validity Period
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startsAt">Start Date & Time</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
                <p className="text-xs text-stone-500">
                  Leave empty to start immediately
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">End Date & Time</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
                <p className="text-xs text-stone-500">
                  Leave empty for no expiration
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Status</h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-stone-300 w-5 h-5"
              />
              <div>
                <span className="font-medium text-stone-900">Active</span>
                <p className="text-sm text-stone-500">
                  Customers can use this code
                </p>
              </div>
            </label>
          </div>

          {/* Usage stats (edit mode) */}
          {mode === "edit" && discount && (
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h2 className="font-medium text-stone-900">Usage</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Times used</span>
                  <span className="font-medium">
                    {discount.usesCount || 0}
                    {discount.maxUses && ` / ${discount.maxUses}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Preview</h2>
            <div className="bg-stone-50 rounded-lg p-4 text-center">
              <code className="text-lg font-mono font-bold text-stone-900">
                {code || "CODE"}
              </code>
              <p className="text-sm text-stone-600 mt-2">
                {type === "percentage" ? `${value || 0}% off` : `£${value || 0} off`}
                {minOrderValue && ` on orders over £${minOrderValue}`}
              </p>
            </div>
          </div>

          {/* Delete */}
          {mode === "edit" && (
            <div className="bg-white rounded-lg border p-6">
              <Button
                type="button"
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Discount
              </Button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
