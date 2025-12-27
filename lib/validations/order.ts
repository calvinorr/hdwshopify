import { z } from "zod";

// Address schema (used for shipping/billing)
export const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  company: z.string().optional(),
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().length(2, "Country must be 2-letter ISO code"),
  phone: z.string().optional(),
});

// Order item schema
const orderItemSchema = z.object({
  variantId: z.number().int().positive().optional().nullable(),
  productName: z.string().min(1),
  variantName: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  price: z.number().positive("Price must be positive"),
  weightGrams: z.number().int().positive().optional(),
});

// Create order schema
export const createOrderSchema = z.object({
  customerId: z.number().int().positive().optional().nullable(),
  email: z.string().email("Invalid email address"),
  // Pricing
  subtotal: z.number().min(0),
  shippingCost: z.number().min(0),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  total: z.number().positive("Total must be positive"),
  currency: z.string().length(3).default("GBP"),
  // Discount
  discountCodeId: z.number().int().positive().optional().nullable(),
  // Shipping
  shippingMethod: z.string().optional(),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  // Notes
  customerNotes: z.string().max(1000).optional(),
  // Items
  items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
});

// Update order schema (for status changes, tracking, notes)
export const updateOrderSchema = z.object({
  status: z
    .enum([
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ])
    .optional(),
  paymentStatus: z
    .enum(["pending", "paid", "failed", "refunded"])
    .optional(),
  trackingNumber: z.string().max(100).optional().nullable(),
  trackingUrl: z.string().url().optional().nullable(),
  internalNotes: z.string().max(5000).optional(),
  shippedAt: z.string().datetime().optional().nullable(),
  deliveredAt: z.string().datetime().optional().nullable(),
});

// Query params schema
export const orderQuerySchema = z.object({
  q: z.string().optional(), // Search by order number or email
  status: z
    .enum([
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ])
    .optional(),
  payment: z
    .enum(["pending", "paid", "failed", "refunded"])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Export types
export type AddressInput = z.infer<typeof addressSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
