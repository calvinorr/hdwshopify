import { db } from "@/lib/db";
import { discountCodes } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

// Force dynamic rendering to always show fresh data
export const dynamic = "force-dynamic";
import Link from "next/link";
import {
  Plus,
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
  Percent,
  PoundSterling,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

async function getDiscountCodes() {
  return db.query.discountCodes.findMany({
    orderBy: [desc(discountCodes.createdAt)],
  });
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatus(discount: {
  active: boolean | null;
  startsAt: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  usesCount: number | null;
}) {
  if (!discount.active) return { label: "Inactive", color: "bg-stone-100 text-stone-600" };

  const now = new Date();
  if (discount.startsAt && new Date(discount.startsAt) > now) {
    return { label: "Scheduled", color: "bg-blue-100 text-blue-700" };
  }
  if (discount.expiresAt && new Date(discount.expiresAt) < now) {
    return { label: "Expired", color: "bg-red-100 text-red-700" };
  }
  if (discount.maxUses && discount.usesCount && discount.usesCount >= discount.maxUses) {
    return { label: "Used up", color: "bg-amber-100 text-amber-700" };
  }

  return { label: "Active", color: "bg-green-100 text-green-700" };
}

export default async function DiscountsPage() {
  const codes = await getDiscountCodes();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-stone-900">
            Discount Codes
          </h1>
          <p className="text-stone-600 mt-1">
            Create and manage promotional discount codes
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/discounts/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Discount
          </Link>
        </Button>
      </div>

      {/* Discount codes list */}
      {codes.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Tag className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-900 mb-2">
            No discount codes yet
          </h3>
          <p className="text-stone-500 mb-4">
            Create discount codes to offer promotions to your customers.
          </p>
          <Button asChild>
            <Link href="/admin/discounts/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Discount
            </Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-stone-50 border-b">
              <tr>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3">
                  Code
                </th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                  Discount
                </th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                  Usage
                </th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Valid Period
                </th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {codes.map((discount) => {
                const status = getStatus(discount);
                return (
                  <tr key={discount.id} className="hover:bg-stone-50">
                    {/* Code */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <code className="bg-stone-100 px-2 py-1 rounded text-sm font-mono font-medium text-stone-900">
                          {discount.code}
                        </code>
                        <button
                          className="text-stone-400 hover:text-stone-600"
                          title="Copy code"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      {discount.minOrderValue && (
                        <p className="text-xs text-stone-500 mt-1">
                          Min. order: £{discount.minOrderValue.toFixed(2)}
                        </p>
                      )}
                    </td>

                    {/* Discount value */}
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        {discount.type === "percentage" ? (
                          <>
                            <Percent className="h-4 w-4 text-stone-400" />
                            <span className="font-medium">{discount.value}% off</span>
                          </>
                        ) : (
                          <>
                            <PoundSterling className="h-4 w-4 text-stone-400" />
                            <span className="font-medium">£{discount.value.toFixed(2)} off</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Usage */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-stone-600">
                        {discount.usesCount || 0}
                        {discount.maxUses ? ` / ${discount.maxUses}` : ""} uses
                      </span>
                    </td>

                    {/* Valid period */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="text-sm text-stone-600">
                        {discount.startsAt || discount.expiresAt ? (
                          <>
                            {formatDate(discount.startsAt) || "Any time"}
                            {" - "}
                            {formatDate(discount.expiresAt) || "No end"}
                          </>
                        ) : (
                          <span className="text-stone-400">No restrictions</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/discounts/${discount.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
