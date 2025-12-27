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
import { ImageUpload } from "@/components/admin/image-upload";

// Client-side form schema
const variantFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Variant name is required"),
  sku: z.string().optional().nullable(),
  price: z.number().positive("Price must be positive"),
  compareAtPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0, "Stock cannot be negative").nullable(),
  weightGrams: z.number().int().positive().nullable(),
});

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
  categoryId: z.string().optional(), // Keep as string for select, convert on submit
  basePrice: z.number().positive("Base price must be positive"),
  compareAtPrice: z.number().positive().optional().nullable(),
  status: z.enum(["active", "draft", "archived"]),
  featured: z.boolean(),
  fiberContent: z.string().optional(),
  weight: z.string().optional(),
  yardage: z.string().optional(),
  careInstructions: z.string().optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  variants: z.array(variantFormSchema).min(1, "At least one variant is required"),
  images: z.array(imageFormSchema).optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Variant {
  id?: number;
  name: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number | null;
  weightGrams: number | null;
  position: number | null;
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

interface WeightType {
  id: number;
  name: string;
  label: string;
  active: boolean | null;
}

interface Props {
  product?: Product;
  categories: Category[];
  weightTypes: WeightType[];
  mode: "create" | "edit";
}

export function ProductForm({ product, categories, weightTypes, mode }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const defaultVariant = {
    name: "Default",
    sku: "",
    price: product?.basePrice || 0,
    compareAtPrice: null,
    stock: 0,
    weightGrams: 100,
  };

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
      basePrice: product?.basePrice || 0,
      compareAtPrice: product?.compareAtPrice || undefined,
      status: product?.status || "draft",
      featured: product?.featured || false,
      fiberContent: product?.fiberContent || "",
      weight: product?.weight || "",
      yardage: product?.yardage || "",
      careInstructions: product?.careInstructions || "",
      metaTitle: product?.metaTitle || "",
      metaDescription: product?.metaDescription || "",
      variants: product?.variants?.length ? product.variants : [defaultVariant],
      images: product?.images || [],
    },
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: "variants",
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

  // Add new variant
  const handleAddVariant = () => {
    appendVariant({
      name: "",
      sku: "",
      price: watch("basePrice") || 0,
      compareAtPrice: null,
      stock: 0,
      weightGrams: 100,
    });
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
        variants: data.variants.map((v, i) => ({
          ...v,
          position: i,
          sku: v.sku || null,
          compareAtPrice: v.compareAtPrice || null,
        })),
        images: data.images,
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
                placeholder="e.g., Merino DK"
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
                placeholder="merino-dk"
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

          {/* Variants */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-stone-900">Variants</h2>
              <Button type="button" variant="outline" size="sm" onClick={handleAddVariant}>
                <Plus className="h-4 w-4 mr-1" />
                Add Variant
              </Button>
            </div>

            {errors.variants && (
              <p className="text-sm text-red-600">{errors.variants.message}</p>
            )}

            <div className="space-y-3">
              {variantFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg"
                >
                  <GripVertical className="h-5 w-5 text-stone-400 mt-2 cursor-grab" />

                  <div className="flex-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <Label className="text-xs">Name / Colorway</Label>
                      <Input
                        {...register(`variants.${index}.name`)}
                        placeholder="e.g., Ocean Blue"
                        className="mt-1"
                      />
                      {errors.variants?.[index]?.name && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.variants[index]?.name?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">SKU</Label>
                      <Input
                        {...register(`variants.${index}.sku`)}
                        placeholder="Optional"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price (£)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`variants.${index}.price`, { valueAsNumber: true })}
                        className="mt-1"
                      />
                      {errors.variants?.[index]?.price && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.variants[index]?.price?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Stock</Label>
                      <Input
                        type="number"
                        {...register(`variants.${index}.stock`, { valueAsNumber: true })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Weight (grams)</Label>
                      <Input
                        type="number"
                        {...register(`variants.${index}.weightGrams`, { valueAsNumber: true })}
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
                    disabled={variantFields.length === 1}
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imageFields.map((field, index) => (
                <div
                  key={field.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-stone-100 group"
                >
                  <img
                    src={watch(`images.${index}.url`)}
                    alt={watch(`images.${index}.alt`) || "Product image"}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Add new image */}
              <ImageUpload
                value={undefined}
                onChange={(url) => {
                  if (url) {
                    setValue("images", [
                      ...watch("images") || [],
                      { url, alt: "", position: imageFields.length },
                    ]);
                  }
                }}
                aspectRatio="square"
              />
            </div>

            {imageFields.length === 0 && (
              <p className="text-sm text-stone-500 text-center">
                Click or drag an image above to add product photos
              </p>
            )}
          </div>

          {/* SEO */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-medium text-stone-900">SEO</h2>

            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                {...register("metaTitle")}
                placeholder={watchName || "Product name"}
              />
              <p className="text-xs text-stone-500">
                {(watchMetaTitle || "").length}/60 characters
              </p>
              {errors.metaTitle && (
                <p className="text-sm text-red-600">{errors.metaTitle.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                {...register("metaDescription")}
                placeholder="Brief description for search engines..."
                rows={2}
              />
              <p className="text-xs text-stone-500">
                {(watchMetaDescription || "").length}/160 characters
              </p>
              {errors.metaDescription && (
                <p className="text-sm text-red-600">{errors.metaDescription.message}</p>
              )}
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

            <Controller
              name="featured"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="rounded border-stone-300"
                  />
                  <span className="text-sm text-stone-700">Featured product</span>
                </label>
              )}
            />
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
                {...register("basePrice", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.basePrice && (
                <p className="text-sm text-red-600">{errors.basePrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="compareAtPrice">Compare at Price (£)</Label>
              <Input
                id="compareAtPrice"
                type="number"
                step="0.01"
                {...register("compareAtPrice", { valueAsNumber: true })}
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

            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select value={field.value || "none"} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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

          {/* Delete */}
          {mode === "edit" && (
            <div className="bg-white rounded-lg border p-6">
              <Button
                type="button"
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
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
