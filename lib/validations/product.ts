import { z } from "zod";

// Variant schema
const variantSchema = z.object({
  id: z.number().int().positive().optional(), // For updates
  name: z.string().min(1, "Variant name is required"),
  sku: z.string().max(100).optional().nullable(),
  price: z.number().positive("Price must be positive"),
  compareAtPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0, "Stock cannot be negative").default(0),
  weightGrams: z.number().int().positive().default(100),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional().nullable(),
});

// Image schema
const imageSchema = z.object({
  id: z.number().int().positive().optional(), // For updates
  url: z.string().url("Invalid image URL"),
  alt: z.string().max(255).optional(),
  variantId: z.number().int().positive().optional().nullable(),
});

// Create product schema
export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with hyphens only"
    ),
  description: z.string().optional(),
  categoryId: z.number().int().positive().optional().nullable(),
  basePrice: z.number().positive("Base price must be positive"),
  compareAtPrice: z.number().positive().optional().nullable(),
  status: z.enum(["active", "draft", "archived"]).default("draft"),
  featured: z.boolean().default(false),
  // Yarn-specific fields
  fiberContent: z.string().max(500).optional(),
  weight: z.string().max(100).optional(), // Laceweight, 4ply, DK, Aran
  yardage: z.string().max(100).optional(),
  careInstructions: z.string().max(1000).optional(),
  // SEO
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  // Related data
  variants: z.array(variantSchema).optional(),
  images: z.array(imageSchema).optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
});

// Update product schema (all fields optional)
export const updateProductSchema = createProductSchema.partial();

// Query params schema
export const productQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "active", "draft", "archived"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Export types
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
