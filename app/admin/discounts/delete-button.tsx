"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface DeleteDiscountButtonProps {
  discountId: number;
  discountCode: string;
}

export function DeleteDiscountButton({ discountId, discountCode }: DeleteDiscountButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the discount code "${discountCode}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/discounts/${discountId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete discount");
      }

      toast.success("Discount code deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete discount");
    }
  };

  return (
    <DropdownMenuItem
      className="text-red-600 cursor-pointer"
      onClick={handleDelete}
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </DropdownMenuItem>
  );
}
