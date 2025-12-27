import { z } from "zod";

// Create collection (category) schema
export const createCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with hyphens only"
    ),
  description: z.string().max(5000).optional(),
  image: z.string().url("Invalid image URL").optional().nullable(),
  parentId: z.number().int().positive().optional().nullable(),
  position: z.number().int().min(0).default(0),
  // Product assignments
  productIds: z.array(z.number().int().positive()).optional(),
});

// Update collection schema (all fields optional)
export const updateCollectionSchema = createCollectionSchema.partial();

// Query params schema
export const collectionQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Export types
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type CollectionQueryInput = z.infer<typeof collectionQuerySchema>;
