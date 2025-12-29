"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Save,
  Trash2,
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
import { ImageUpload } from "@/components/admin/image-upload";
import { SortableImageGrid } from "@/components/admin/sortable-image-grid";

// Client-side form schema
const imageFormSchema = z.object({
  id: z.number().optional(),
  url: z.string().url("Invalid image URL"),
  alt: z.string().optional().nullable(),
  position: z.number().optional().nullable(),
});

const productFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  compareAtPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0, "Stock cannot be negative").nullable(),
  sku: z.string().optional().nullable(),
  weightGrams: z.number().int().positive().nullable(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional().nullable(),
  status: z.enum(["active", "draft", "archived"]),
  featured: z.boolean(),
  fiberContent: z.string().optional(),
  weight: z.string().optional(),
  yardage: z.string().optional(),
  careInstructions: z.string().optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  images: z.array(imageFormSchema).optional(),
  tagIds: z.array(z.number()).optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ProductImage {
  id?: number;
  url: string;
  alt: string | null;
  position: number | null;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  categoryId: number | null;
  price: number;
  compareAtPrice: number | null;
  stock: number | null;
  sku: string | null;
  weightGrams: number | null;
  colorHex: string | null;
  status: "active" | "draft" | "archived" | null;
  featured: boolean | null;
  fiberContent: string | null;
  weight: string | null;
  yardage: string | null;
  careInstructions: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  images: ProductImage[];
  category: Category | null;
}

interface WeightType {
  id: number;
  name: string;
  label: string;
  active: boolean | null;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string | null;
}

interface TagAssignment {
  tagId: number;
  tag: Tag;
}

interface Props {
  product?: Product & { tagAssignments?: TagAssignment[] };
  categories: Category[];
  weightTypes: WeightType[];
  tags: Tag[];
  mode: "create" | "edit";
}

export function ProductForm({ product, categories, weightTypes, tags, mode }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Extract existing tag IDs from product's tag assignments
  const existingTagIds = product?.tagAssignments?.map((ta) => ta.tagId) || [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      categoryId: product?.categoryId?.toString() || "none",
      price: product?.price || 0,
      compareAtPrice: product?.compareAtPrice || undefined,
      stock: product?.stock ?? 0,
      sku: product?.sku || "",
      weightGrams: product?.weightGrams ?? 100,
      colorHex: product?.colorHex || null,
      status: product?.status || "draft",
      featured: product?.featured || false,
      fiberContent: product?.fiberContent || "",
      weight: product?.weight || "",
      yardage: product?.yardage || "",
      careInstructions: product?.careInstructions || "",
      metaTitle: product?.metaTitle || "",
      metaDescription: product?.metaDescription || "",
      images: product?.images || [],
      tagIds: existingTagIds,
    },
  });

  const {
    fields: imageFields,
    remove: removeImage,
  } = useFieldArray({
    control,
    name: "images",
  });

  const watchName = watch("name");
  const watchSlug = watch("slug");
  const watchMetaTitle = watch("metaTitle");
  const watchMetaDescription = watch("metaDescription");

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("name", value);
    if (mode === "create" || watchSlug === generateSlug(product?.name || "")) {
      setValue("slug", generateSlug(value));
    }
  };

  // Delete product
  const handleDelete = async () => {
    if (!product?.id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    setServerError(null);

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete product");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to delete product");
      setDeleting(false);
    }
  };

  // Form submission
  const onSubmit = async (data: ProductFormData) => {
    setServerError(null);

    try {
      const payload = {
        ...data,
        categoryId: data.categoryId && data.categoryId !== "none" ? parseInt(data.categoryId) : null,
        compareAtPrice: data.compareAtPrice || null,
        sku: data.sku || null,
        colorHex: data.colorHex || null,
        images: data.images,
        tagIds: data.tagIds || [],
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
        const responseData = await response.json();
        throw new Error(responseData.error || "Failed to save product");
      }

      const responseData = await response.json();
      router.push(`/admin/products/${responseData.product.id}`);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </div>

      {/* Server Error */}
      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {serverError}
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
                {...register("name")}
                onChange={handleNameChange}
                placeholder="e.g., Merino DK - Autumn Gold"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="merino-dk-autumn-gold"
              />
              <p className="text-xs text-stone-500">
                /products/{watchSlug || "product-name"}
              </p>
              {errors.slug && (
                <p className="text-sm text-red-600">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe your product..."
                rows={5}
              />
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Pricing & Inventory</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price (£) *</Label>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      placeholder="24.00"
                    />
                  )}
                />
                {errors.price && (
                  <p className="text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare at Price</Label>
                <Controller
                  name="compareAtPrice"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="compareAtPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="30.00"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Controller
                  name="stock"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      placeholder="10"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  {...register("sku")}
                  placeholder="MDK-AG-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weightGrams">Weight (grams)</Label>
                <Controller
                  name="weightGrams"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="weightGrams"
                      type="number"
                      min="0"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="100"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="colorHex">Color (hex)</Label>
                <div className="flex gap-2">
                  <Input
                    id="colorHex"
                    {...register("colorHex")}
                    placeholder="#C4A77D"
                    className="flex-1"
                  />
                  {watch("colorHex") && /^#[0-9A-Fa-f]{6}$/.test(watch("colorHex") || "") && (
                    <div
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: watch("colorHex") || undefined }}
                    />
                  )}
                </div>
              </div>
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
                  {...register("fiberContent")}
                  placeholder="e.g., 100% Merino Wool"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Controller
                  name="weight"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select weight" />
                      </SelectTrigger>
                      <SelectContent>
                        {weightTypes.filter(w => w.active !== false).map((wt) => (
                          <SelectItem key={wt.id} value={wt.name}>
                            {wt.label}
                          </SelectItem>
                        ))}
                        {weightTypes.length === 0 && (
                          <div className="py-2 px-2 text-sm text-muted-foreground">
                            No weight types defined
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {weightTypes.length === 0 && (
                  <p className="text-xs text-amber-600">
                    <Link href="/admin/settings/taxonomies" className="underline">
                      Add weight types
                    </Link>{" "}
                    in Settings &rarr; Taxonomies
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="yardage">Yardage</Label>
                <Input
                  id="yardage"
                  {...register("yardage")}
                  placeholder="e.g., 400m / 437yds"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="careInstructions">Care Instructions</Label>
                <Input
                  id="careInstructions"
                  {...register("careInstructions")}
                  placeholder="e.g., Hand wash cold"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Images</h2>

            <SortableImageGrid
              images={imageFields}
              onRemove={removeImage}
              onReorder={(newOrder) => {
                setValue("images", newOrder);
              }}
              renderUploader={() => (
                <ImageUpload
                  onChange={(url) => {
                    if (url) {
                      const currentImages = watch("images") || [];
                      setValue("images", [
                        ...currentImages,
                        { url, alt: null, position: currentImages.length },
                      ]);
                    }
                  }}
                />
              )}
            />
          </div>

          {/* SEO */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">SEO</h2>

            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                {...register("metaTitle")}
                maxLength={70}
                placeholder="Page title for search engines"
              />
              <p className="text-xs text-stone-500">
                {watchMetaTitle?.length || 0}/70 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                {...register("metaDescription")}
                maxLength={160}
                rows={3}
                placeholder="Description for search results"
              />
              <p className="text-xs text-stone-500">
                {watchMetaDescription?.length || 0}/160 characters
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Status</h2>

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                {...register("featured")}
                className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="featured" className="font-normal">
                Featured product
              </Label>
            </div>
          </div>

          {/* Category */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Category</h2>

            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select value={field.value || "none"} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">Tags</h2>

            <Controller
              name="tagIds"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  {tags.map((tag) => (
                    <label key={tag.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.value?.includes(tag.id) || false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            field.onChange([...(field.value || []), tag.id]);
                          } else {
                            field.onChange(field.value?.filter((id) => id !== tag.id) || []);
                          }
                        }}
                        className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm">{tag.name}</span>
                    </label>
                  ))}
                  {tags.length === 0 && (
                    <p className="text-sm text-stone-500">No tags defined</p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Delete */}
          {mode === "edit" && product && (
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <h2 className="font-medium text-stone-900">Danger Zone</h2>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Deleting..." : "Delete Product"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
