import { z } from "zod";

// Create discount schema
export const createDiscountSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(50)
    .regex(
      /^[A-Z0-9_-]+$/i,
      "Code must contain only letters, numbers, underscores, and hyphens"
    )
    .transform((val) => val.toUpperCase()), // Normalize to uppercase
  type: z.enum(["percentage", "fixed"]),
  value: z.number().positive("Value must be positive"),
  minOrderValue: z.number().min(0).optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  active: z.boolean().default(true),
}).refine(
  (data) => {
    // Percentage discount must be 0-100
    if (data.type === "percentage" && data.value > 100) {
      return false;
    }
    return true;
  },
  {
    message: "Percentage discount cannot exceed 100%",
    path: ["value"],
  }
).refine(
  (data) => {
    // Expiry must be after start
    if (data.startsAt && data.expiresAt) {
      return new Date(data.expiresAt) > new Date(data.startsAt);
    }
    return true;
  },
  {
    message: "Expiry date must be after start date",
    path: ["expiresAt"],
  }
);

// Update discount schema
export const updateDiscountSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i)
    .transform((val) => val.toUpperCase())
    .optional(),
  type: z.enum(["percentage", "fixed"]).optional(),
  value: z.number().positive().optional(),
  minOrderValue: z.number().min(0).optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  active: z.boolean().optional(),
});

// Validate discount code (for checkout)
export const validateDiscountSchema = z.object({
  code: z.string().min(1, "Code is required"),
  orderTotal: z.number().min(0),
});

// Query params schema
export const discountQuerySchema = z.object({
  search: z.string().optional(),
  active: z.enum(["all", "true", "false"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Export types
export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
export type UpdateDiscountInput = z.infer<typeof updateDiscountSchema>;
export type ValidateDiscountInput = z.infer<typeof validateDiscountSchema>;
export type DiscountQueryInput = z.infer<typeof discountQuerySchema>;
