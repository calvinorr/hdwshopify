"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  GripVertical,
  X,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
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

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Variant {
  id?: number;
  name: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  weightGrams: number;
  position: number;
}

interface ProductImage {
  id?: number;
  url: string;
  alt: string | null;
  position: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  categoryId: number | null;
  basePrice: number;
  compareAtPrice: number | null;
  status: "active" | "draft" | "archived" | null;
  featured: boolean | null;
  fiberContent: string | null;
  weight: string | null;
  yardage: string | null;
  careInstructions: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  variants: Variant[];
  images: ProductImage[];
  category: Category | null;
}

interface Props {
  product?: Product;
  categories: Category[];
  mode: "create" | "edit";
}

export function ProductForm({ product, categories, mode }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [description, setDescription] = useState(product?.description || "");
  const [categoryId, setCategoryId] = useState<string>(
    product?.categoryId?.toString() || ""
  );
  const [basePrice, setBasePrice] = useState(product?.basePrice?.toString() || "");
  const [compareAtPrice, setCompareAtPrice] = useState(
    product?.compareAtPrice?.toString() || ""
  );
  const [status, setStatus] = useState<string>(product?.status || "draft");
  const [featured, setFeatured] = useState(product?.featured || false);

  // Yarn-specific
  const [fiberContent, setFiberContent] = useState(product?.fiberContent || "");
  const [weight, setWeight] = useState(product?.weight || "");
  const [yardage, setYardage] = useState(product?.yardage || "");
  const [careInstructions, setCareInstructions] = useState(
    product?.careInstructions || ""
  );

  // SEO
  const [metaTitle, setMetaTitle] = useState(product?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(
    product?.metaDescription || ""
  );

  // Variants
  const [variants, setVariants] = useState<Variant[]>(
    product?.variants || [
      {
        name: "Default",
        sku: "",
        price: parseFloat(basePrice) || 0,
        compareAtPrice: null,
        stock: 0,
        weightGrams: 100,
        position: 0,
      },
    ]
  );

  // Images
  const [images, setImages] = useState<ProductImage[]>(product?.images || []);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (mode === "create" || slug === generateSlug(product?.name || "")) {
      setSlug(generateSlug(value));
    }
  };

  // Variant management
  const addVariant = () => {
    setVariants([
      ...variants,
      {
        name: "",
        sku: "",
        price: parseFloat(basePrice) || 0,
        compareAtPrice: null,
        stock: 0,
        weightGrams: 100,
        position: variants.length,
      },
    ]);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    if (variants.length === 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

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
        categoryId: categoryId ? parseInt(categoryId) : null,
        basePrice: parseFloat(basePrice),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        status,
        featured,
        fiberContent,
        weight,
        yardage,
        careInstructions,
        metaTitle,
        metaDescription,
        variants: variants.map((v, i) => ({
          ...v,
          position: i,
          price: typeof v.price === "string" ? parseFloat(v.price) : v.price,
          stock: typeof v.stock === "string" ? parseInt(v.stock as any) : v.stock,
          weightGrams:
            typeof v.weightGrams === "string"
              ? parseInt(v.weightGrams as any)
              : v.weightGrams,
        })),
        images,
      };

      const url =
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${product?.id}`;

      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save product");
      }

      const data = await response.json();
      router.push(`/admin/products/${data.product.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-semibold text-stone-900">
              {mode === "create" ? "Add Product" : "Edit Product"}
            </h1>
            {product && (
              <p className="text-stone-500 text-sm mt-1">ID: {product.id}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/products">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Product"}
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
            <h2 className="font-medium text-stone-900">Basic Information</h2>

            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Merino DK"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="merino-dk"
              />
              <p className="text-xs text-stone-500">
                /products/{slug || "product-name"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product..."
                rows={5}
              />
            </div>
          </div>

          {/* Yarn details */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Yarn Details</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fiberContent">Fiber Content</Label>
                <Input
                  id="fiberContent"
                  value={fiberContent}
                  onChange={(e) => setFiberContent(e.target.value)}
                  placeholder="e.g., 100% Merino Wool"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Select value={weight} onValueChange={setWeight}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select weight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laceweight">Laceweight</SelectItem>
                    <SelectItem value="Heavy Laceweight">Heavy Laceweight</SelectItem>
                    <SelectItem value="4ply">4 Ply / Fingering</SelectItem>
                    <SelectItem value="DK">DK</SelectItem>
                    <SelectItem value="Aran">Aran / Worsted</SelectItem>
                    <SelectItem value="Chunky">Chunky</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="yardage">Yardage</Label>
                <Input
                  id="yardage"
                  value={yardage}
                  onChange={(e) => setYardage(e.target.value)}
                  placeholder="e.g., 400m / 437yds"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="careInstructions">Care Instructions</Label>
                <Input
                  id="careInstructions"
                  value={careInstructions}
                  onChange={(e) => setCareInstructions(e.target.value)}
                  placeholder="e.g., Hand wash cold"
                />
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-stone-900">Variants</h2>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="h-4 w-4 mr-1" />
                Add Variant
              </Button>
            </div>

            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg"
                >
                  <GripVertical className="h-5 w-5 text-stone-400 mt-2 cursor-grab" />

                  <div className="flex-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <Label className="text-xs">Name / Colorway</Label>
                      <Input
                        value={variant.name}
                        onChange={(e) =>
                          updateVariant(index, "name", e.target.value)
                        }
                        placeholder="e.g., Ocean Blue"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">SKU</Label>
                      <Input
                        value={variant.sku}
                        onChange={(e) =>
                          updateVariant(index, "sku", e.target.value)
                        }
                        placeholder="Optional"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price (£)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) =>
                          updateVariant(index, "price", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Stock</Label>
                      <Input
                        type="number"
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariant(index, "stock", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Weight (grams)</Label>
                      <Input
                        type="number"
                        value={variant.weightGrams}
                        onChange={(e) =>
                          updateVariant(index, "weightGrams", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-stone-400 hover:text-red-500"
                    onClick={() => removeVariant(index)}
                    disabled={variants.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Images</h2>

            {images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-stone-100 group"
                  >
                    <img
                      src={image.url}
                      alt={image.alt || "Product image"}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 p-1.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      onClick={() =>
                        setImages(images.filter((_, i) => i !== index))
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-stone-200 rounded-lg p-8 text-center">
                <ImageIcon className="h-10 w-10 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500 text-sm mb-2">No images yet</p>
                <p className="text-stone-400 text-xs">
                  Images from Shopify are automatically imported
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" disabled>
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
              <span className="text-xs text-stone-400">
                (Image upload coming soon)
              </span>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">SEO</h2>

            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={name || "Product name"}
              />
              <p className="text-xs text-stone-500">
                {metaTitle.length}/60 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Brief description for search engines..."
                rows={2}
              />
              <p className="text-xs text-stone-500">
                {metaDescription.length}/160 characters
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Status</h2>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded border-stone-300"
              />
              <span className="text-sm text-stone-700">Featured product</span>
            </label>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Pricing</h2>

            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price (£) *</Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compareAtPrice">Compare at Price (£)</Label>
              <Input
                id="compareAtPrice"
                type="number"
                step="0.01"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-stone-500">
                Original price for sale items
              </p>
            </div>
          </div>

          {/* Category */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Collection</h2>

            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select collection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Delete */}
          {mode === "edit" && (
            <div className="bg-white rounded-lg border p-6">
              <Button
                type="button"
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Product
              </Button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
