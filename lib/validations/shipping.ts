import { z } from "zod";

// Shipping rate schema
const shippingRateSchema = z.object({
  id: z.number().int().positive().optional(), // For updates
  name: z.string().min(1, "Rate name is required").max(100),
  minWeightGrams: z.number().int().min(0).default(0),
  maxWeightGrams: z.number().int().positive().optional().nullable(),
  price: z.number().min(0, "Price cannot be negative"),
  estimatedDays: z.string().max(20).optional().nullable(), // e.g., "2-4"
  tracked: z.boolean().default(false),
});

// Shipping zone schema (with embedded rates for combined updates)
const shippingZoneWithRatesSchema = z.object({
  id: z.number().int().positive().optional(), // For updates
  name: z.string().min(1, "Zone name is required").max(100),
  countries: z.string(), // JSON string of country codes
  rates: z.array(shippingRateSchema).optional(),
});

// Create shipping zone schema
export const createShippingZoneSchema = z.object({
  name: z.string().min(1, "Zone name is required").max(100),
  countries: z.array(
    z.string().length(2, "Country code must be 2-letter ISO code")
  ).min(1, "At least one country is required"),
  rates: z.array(shippingRateSchema).optional(),
});

// Update shipping zone schema
export const updateShippingZoneSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  countries: z.array(
    z.string().length(2)
  ).min(1).optional(),
  rates: z.array(shippingRateSchema).optional(),
});

// Full shipping settings schema (for admin settings page)
export const shippingSettingsSchema = z.object({
  freeShippingEnabled: z.boolean().default(true),
  freeShippingThreshold: z.coerce.number().min(0).default(50),
  zones: z.array(shippingZoneWithRatesSchema),
});

// Create shipping rate schema (for individual rate creation)
export const createShippingRateSchema = shippingRateSchema.omit({ id: true }).extend({
  zoneId: z.number().int().positive(),
});

// Update shipping rate schema
export const updateShippingRateSchema = shippingRateSchema.partial();

// Calculate shipping schema (for checkout)
export const calculateShippingSchema = z.object({
  country: z.string().length(2, "Country must be 2-letter ISO code"),
  weightGrams: z.number().int().positive("Weight must be positive"),
});

// Export types
export type CreateShippingZoneInput = z.infer<typeof createShippingZoneSchema>;
export type UpdateShippingZoneInput = z.infer<typeof updateShippingZoneSchema>;
export type ShippingSettingsInput = z.infer<typeof shippingSettingsSchema>;
export type CreateShippingRateInput = z.infer<typeof createShippingRateSchema>;
export type UpdateShippingRateInput = z.infer<typeof updateShippingRateSchema>;
export type CalculateShippingInput = z.infer<typeof calculateShippingSchema>;
