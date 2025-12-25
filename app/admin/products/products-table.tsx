"use client";

import Link from "next/link";
import { Package, MoreHorizontal, Edit, Copy, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Product {
  id: number;
  name: string;
  slug: string;
  basePrice: number;
  status: "active" | "draft" | "archived" | null;
  variants: { id: number; stock: number; price: number }[];
  images: { url: string; alt: string | null }[];
  category: { name: string } | null;
}

interface Props {
  products: Product[];
}

export function ProductsTable({ products }: Props) {
  const getTotalStock = (variants: Product["variants"]) => {
    return variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead className="bg-stone-50 border-b">
          <tr>
            <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3">
              Product
            </th>
            <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
              Status
            </th>
            <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
              Inventory
            </th>
            <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
              Category
            </th>
            <th className="text-right text-xs font-medium text-stone-500 uppercase tracking-wider px-4 py-3">
              Price
            </th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-stone-50">
              <td className="px-4 py-3">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="flex items-center gap-3"
                >
                  {/* Image */}
                  <div className="h-10 w-10 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                    {product.images[0] ? (
                      <img
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-stone-400" />
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="min-w-0">
                    <p className="font-medium text-stone-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-stone-500 truncate">
                      {product.variants.length} variant
                      {product.variants.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
              </td>

              <td className="px-4 py-3 hidden sm:table-cell">
                <StatusBadge status={product.status} />
              </td>

              <td className="px-4 py-3 hidden md:table-cell">
                <span
                  className={`text-sm ${
                    getTotalStock(product.variants) < 5
                      ? "text-amber-600 font-medium"
                      : "text-stone-600"
                  }`}
                >
                  {getTotalStock(product.variants)} in stock
                </span>
              </td>

              <td className="px-4 py-3 hidden lg:table-cell">
                <span className="text-sm text-stone-600">
                  {product.category?.name || "—"}
                </span>
              </td>

              <td className="px-4 py-3 text-right">
                <span className="font-medium text-stone-900">
                  £{product.basePrice.toFixed(2)}
                </span>
              </td>

              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/products/${product.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/products/new?duplicate=${product.id}`}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-amber-600">
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const styles = {
    active: "bg-green-100 text-green-700",
    draft: "bg-stone-100 text-stone-600",
    archived: "bg-red-100 text-red-700",
  };

  const statusKey = (status || "draft") as keyof typeof styles;

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[statusKey]}`}
    >
      {status || "draft"}
    </span>
  );
}
