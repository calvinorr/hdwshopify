"use client";

import { useState, useEffect } from "react";
import { Plus, MapPin, MoreVertical, Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddressForm } from "./address-form";

type Address = {
  id: number;
  firstName: string;
  lastName: string;
  company: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/account/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses);
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAddNew = () => {
    setEditingAddress(null);
    setDialogOpen(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete address:", error);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) {
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            isDefault: a.id === id,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to set default:", error);
    }
  };

  const handleSaved = () => {
    setDialogOpen(false);
    setEditingAddress(null);
    fetchAddresses();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-stone-100 animate-pulse rounded" />
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-stone-100 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl text-stone-900">Addresses</h2>
          <p className="text-stone-600 mt-1">
            Manage your shipping and billing addresses.
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-stone-50 rounded-lg border border-dashed border-stone-200">
          <MapPin className="h-12 w-12 mx-auto text-stone-300 mb-3" />
          <p className="text-stone-600 font-medium">No addresses saved</p>
          <p className="text-stone-500 text-sm mt-1">
            Add an address for faster checkout.
          </p>
          <Button onClick={handleAddNew} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => handleEdit(address)}
              onDelete={() => handleDelete(address.id)}
              onSetDefault={() => handleSetDefault(address.id)}
            />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
          </DialogHeader>
          <AddressForm
            address={editingAddress}
            onSaved={handleSaved}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <div className="relative p-4 rounded-lg border border-stone-200 hover:border-stone-300 transition-colors">
      {address.isDefault && (
        <div className="absolute top-3 right-12 flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
          <Star className="h-3 w-3 fill-current" />
          Default
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          {!address.isDefault && (
            <DropdownMenuItem onClick={onSetDefault}>
              <Star className="h-4 w-4 mr-2" />
              Set as default
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={onDelete}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="pr-10">
        <p className="font-medium text-stone-900">
          {address.firstName} {address.lastName}
        </p>
        {address.company && (
          <p className="text-stone-600 text-sm">{address.company}</p>
        )}
        <p className="text-stone-600 text-sm mt-1">{address.line1}</p>
        {address.line2 && (
          <p className="text-stone-600 text-sm">{address.line2}</p>
        )}
        <p className="text-stone-600 text-sm">
          {address.city}
          {address.state ? `, ${address.state}` : ""} {address.postalCode}
        </p>
        <p className="text-stone-600 text-sm">{address.country}</p>
        {address.phone && (
          <p className="text-stone-500 text-sm mt-2">{address.phone}</p>
        )}
      </div>
    </div>
  );
}
