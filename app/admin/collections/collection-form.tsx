"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Trash2,
  FolderTree,
  Search,
  Check,
} from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Product {
  id: number;
  name: string;
  slug: string;
  images: { url: string }[];
}

interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  position: number | null;
  status: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  featured: boolean | null;
  hideOutOfStock: boolean | null;
}

interface Props {
  collection?: Collection;
  products: Product[];
  assignedProductIds: number[];
  mode: "create" | "edit";
}

export function CollectionForm({
  collection,
  products,
  assignedProductIds,
  mode,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(collection?.name || "");
  const [slug, setSlug] = useState(collection?.slug || "");
  const [description, setDescription] = useState(collection?.description || "");
  const [image, setImage] = useState(collection?.image || "");
  const [position, setPosition] = useState(collection?.position?.toString() || "0");
  const [status, setStatus] = useState(collection?.status || "active");
  const [metaTitle, setMetaTitle] = useState(collection?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(collection?.metaDescription || "");
  const [featured, setFeatured] = useState(collection?.featured ?? false);
  const [hideOutOfStock, setHideOutOfStock] = useState(collection?.hideOutOfStock ?? false);

  // Product assignment
  const [selectedProducts, setSelectedProducts] = useState<number[]>(assignedProductIds);
  const [productSearch, setProductSearch] = useState("");

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (mode === "create" || slug === generateSlug(collection?.name || "")) {
      setSlug(generateSlug(value));
    }
  };

  const toggleProduct = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name,
        slug,
        description,
        image: image || null,
        position: parseInt(position) || 0,
        status,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        featured,
        hideOutOfStock,
        productIds: selectedProducts,
      };

      const url =
        mode === "create"
          ? "/api/admin/collections"
          : `/api/admin/collections/${collection?.id}`;

      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save collection");
      }

      const data = await response.json();
      router.push("/admin/collections");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this collection?")) return;

    try {
      const response = await fetch(`/api/admin/collections/${collection?.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete collection");
      }

      router.push("/admin/collections");
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
            <Link href="/admin/collections">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-semibold text-stone-900">
              {mode === "create" ? "Add Collection" : "Edit Collection"}
            </h1>
            {collection && (
              <p className="text-stone-500 text-sm mt-1">/{collection.slug}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/collections">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Collection"}
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
          {/* Basic info */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Collection Details</h2>

            <div className="space-y-2">
              <Label htmlFor="name">Collection Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Laceweight Yarns"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="laceweight-yarns"
              />
              <p className="text-xs text-stone-500">
                /collections/{slug || "collection-name"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this collection..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Collection Image</Label>
              <ImageUpload
                value={image || undefined}
                onChange={(url) => setImage(url || "")}
                aspectRatio="landscape"
                disabled={saving}
              />
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-stone-900">Products</h2>
              <span className="text-sm text-stone-500">
                {selectedProducts.length} selected
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-10"
              />
            </div>

            {/* Product list */}
            <div className="max-h-96 overflow-y-auto border rounded-lg divide-y">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-stone-500">
                  No products found
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = selectedProducts.includes(product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggleProduct(product.id)}
                      className={`w-full flex items-center gap-3 p-3 text-left hover:bg-stone-50 transition-colors ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-stone-300"
                        }`}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>

                      {/* Image */}
                      <div className="h-10 w-10 rounded bg-stone-100 overflow-hidden flex-shrink-0">
                        {product.images[0] ? (
                          <img
                            src={product.images[0].url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <FolderTree className="h-4 w-4 text-stone-300" />
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <span className="flex-1 font-medium text-stone-900 truncate">
                        {product.name}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Status</h2>

            <div className="space-y-2">
              <Label htmlFor="status">Visibility</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-500" />
                      Draft
                    </span>
                  </SelectItem>
                  <SelectItem value="active">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Active
                    </span>
                  </SelectItem>
                  <SelectItem value="archived">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-stone-400" />
                      Archived
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-stone-500">
                {status === "draft" && "Not visible on storefront"}
                {status === "active" && "Visible to customers"}
                {status === "archived" && "Hidden from storefront"}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="featured">Featured</Label>
                <p className="text-xs text-stone-500">Show on homepage</p>
              </div>
              <Switch
                id="featured"
                checked={featured}
                onCheckedChange={setFeatured}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="hideOutOfStock">Hide Out of Stock</Label>
                <p className="text-xs text-stone-500">Only show available items</p>
              </div>
              <Switch
                id="hideOutOfStock"
                checked={hideOutOfStock}
                onCheckedChange={setHideOutOfStock}
              />
            </div>
          </div>

          {/* Position */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Display Order</h2>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                type="number"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-stone-500">
                Lower numbers appear first
              </p>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Search Engine Listing</h2>

            {/* Google Preview */}
            <div className="bg-stone-50 rounded-lg p-4 space-y-1">
              <p className="text-xs text-stone-400 mb-2">Preview</p>
              <p className="text-blue-700 text-lg leading-tight truncate hover:underline cursor-pointer">
                {metaTitle || name || "Collection Title"}
              </p>
              <p className="text-green-700 text-sm truncate">
                herbarium-dyeworks.warmwetcircles.com › collections › {slug || "collection"}
              </p>
              <p className="text-stone-600 text-sm line-clamp-2">
                {metaDescription || description || "Add a meta description to help your collection appear in search results."}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <span className={`text-xs ${metaTitle.length > 60 ? "text-red-500" : "text-stone-400"}`}>
                  {metaTitle.length}/60
                </span>
              </div>
              <Input
                id="metaTitle"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={name || "Collection name"}
              />
              <p className="text-xs text-stone-500">
                Leave blank to use collection name
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <span className={`text-xs ${metaDescription.length > 160 ? "text-red-500" : "text-stone-400"}`}>
                  {metaDescription.length}/160
                </span>
              </div>
              <Textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={description || "Describe this collection for search engines..."}
                rows={3}
              />
              <p className="text-xs text-stone-500">
                Leave blank to use collection description
              </p>
            </div>
          </div>

          {/* Quick stats */}
          {mode === "edit" && (
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h2 className="font-medium text-stone-900">Quick Stats</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Products</span>
                  <span className="font-medium">{selectedProducts.length}</span>
                </div>
              </div>
            </div>
          )}

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
                Delete Collection
              </Button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
