import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Categories
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  parentId: integer("parent_id"), // Self-reference handled via relations
  position: integer("position").default(0),
  shopifyCollectionId: text("shopify_collection_id"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// Products
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  basePrice: real("base_price").notNull(),
  compareAtPrice: real("compare_at_price"),
  status: text("status", { enum: ["active", "draft", "archived"] }).default("draft"),
  featured: integer("featured", { mode: "boolean" }).default(false),
  // Yarn-specific attributes
  fiberContent: text("fiber_content"),
  weight: text("weight"), // Laceweight, 4ply, DK, Aran
  yardage: text("yardage"),
  careInstructions: text("care_instructions"),
  // SEO
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  // Shopify sync
  shopifyId: text("shopify_id"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
}, (table) => [
  index("products_status_idx").on(table.status),
  index("products_category_idx").on(table.categoryId),
  index("products_featured_idx").on(table.featured),
]);

// Product Variants (colorways, sizes)
export const productVariants = sqliteTable("product_variants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Bunny Paw", "French Rose"
  sku: text("sku"),
  price: real("price").notNull(),
  compareAtPrice: real("compare_at_price"),
  stock: integer("stock").default(0),
  weightGrams: integer("weight_grams").default(100), // For shipping calculation
  position: integer("position").default(0),
  shopifyVariantId: text("shopify_variant_id"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
}, (table) => [
  index("variants_product_idx").on(table.productId),
  index("variants_sku_idx").on(table.sku),
]);

// Product Images
export const productImages = sqliteTable("product_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  url: text("url").notNull(),
  alt: text("alt"),
  position: integer("position").default(0),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
}, (table) => [
  index("images_product_idx").on(table.productId),
  index("images_variant_idx").on(table.variantId),
]);

// Customers
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  clerkId: text("clerk_id").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  acceptsMarketing: integer("accepts_marketing", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
}, (table) => [
  index("customers_clerk_idx").on(table.clerkId),
]);

// Addresses
export const addresses = sqliteTable("addresses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["shipping", "billing"] }).default("shipping"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  company: text("company"),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state"),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),
  phone: text("phone"),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Shipping Zones
export const shippingZones = sqliteTable("shipping_zones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  countries: text("countries").notNull(), // JSON array of country codes
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Shipping Rates
export const shippingRates = sqliteTable("shipping_rates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  zoneId: integer("zone_id").notNull().references(() => shippingZones.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Royal Mail Large Letter", "Evri 0-2kg"
  minWeightGrams: integer("min_weight_grams").default(0),
  maxWeightGrams: integer("max_weight_grams"),
  price: real("price").notNull(),
  estimatedDays: text("estimated_days"), // e.g., "2-4"
  tracked: integer("tracked", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Discount Codes
export const discountCodes = sqliteTable("discount_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  type: text("type", { enum: ["percentage", "fixed"] }).notNull(),
  value: real("value").notNull(), // Percentage or fixed amount
  minOrderValue: real("min_order_value"),
  maxUses: integer("max_uses"),
  usesCount: integer("uses_count").default(0),
  startsAt: text("starts_at"),
  expiresAt: text("expires_at"),
  active: integer("active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Orders
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  email: text("email").notNull(),
  status: text("status", {
    enum: ["pending", "processing", "shipped", "delivered", "cancelled", "refunded", "on-hold"]
  }).default("pending"),
  paymentStatus: text("payment_status", {
    enum: ["pending", "paid", "failed", "refunded"]
  }).default("pending"),
  // Pricing
  subtotal: real("subtotal").notNull(),
  shippingCost: real("shipping_cost").notNull(),
  discountAmount: real("discount_amount").default(0),
  taxAmount: real("tax_amount").default(0),
  total: real("total").notNull(),
  currency: text("currency").default("GBP"),
  // Discount
  discountCodeId: integer("discount_code_id").references(() => discountCodes.id),
  // Shipping
  shippingMethod: text("shipping_method"),
  shippingAddress: text("shipping_address").notNull(), // JSON
  billingAddress: text("billing_address"), // JSON
  // Tracking
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  // Stripe
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  // Notes
  customerNotes: text("customer_notes"),
  internalNotes: text("internal_notes"),
  // Timestamps
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
  shippedAt: text("shipped_at"),
  deliveredAt: text("delivered_at"),
}, (table) => [
  index("orders_customer_idx").on(table.customerId),
  index("orders_email_idx").on(table.email),
  index("orders_status_idx").on(table.status),
  index("orders_payment_status_idx").on(table.paymentStatus),
  index("orders_created_at_idx").on(table.createdAt),
]);

// Order Items
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").references(() => productVariants.id),
  productName: text("product_name").notNull(),
  variantName: text("variant_name"),
  sku: text("sku"),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
  weightGrams: integer("weight_grams"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Newsletter Subscribers
export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  status: text("status", { enum: ["subscribed", "unsubscribed"] }).default("subscribed"),
  source: text("source").default("website"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Cart (for persistent carts)
export const carts = sqliteTable("carts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  sessionId: text("session_id"), // For guest carts
  items: text("items").notNull(), // JSON array of cart items
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "parentChild",
  }),
  children: many(categories, { relationName: "parentChild" }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
  images: many(productImages),
  tagAssignments: many(productTagAssignments),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [productImages.variantId],
    references: [productVariants.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  carts: many(carts),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, {
    fields: [addresses.customerId],
    references: [customers.id],
  }),
}));

export const shippingZonesRelations = relations(shippingZones, ({ many }) => ({
  rates: many(shippingRates),
}));

export const shippingRatesRelations = relations(shippingRates, ({ one }) => ({
  zone: one(shippingZones, {
    fields: [shippingRates.zoneId],
    references: [shippingZones.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  discountCode: one(discountCodes, {
    fields: [orders.discountCodeId],
    references: [discountCodes.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const cartsRelations = relations(carts, ({ one }) => ({
  customer: one(customers, {
    fields: [carts.customerId],
    references: [customers.id],
  }),
}));

// Site Settings (key-value store for configuration)
export const siteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(), // JSON string for complex values
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// Weight Types (editable taxonomy for yarn weights)
export const weightTypes = sqliteTable("weight_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(), // e.g., "DK", "4ply", "Aran"
  label: text("label").notNull(), // Display label e.g., "DK (Double Knitting)"
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  active: integer("active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// Product Tags (flexible tagging system)
export const productTags = sqliteTable("product_tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(), // e.g., "hand-dyed", "limited-edition"
  slug: text("slug").notNull().unique(),
  color: text("color").default("#6b7280"), // Badge color in admin (hex)
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Product Tag Assignments (many-to-many junction table)
export const productTagAssignments = sqliteTable("product_tag_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => productTags.id, { onDelete: "cascade" }),
}, (table) => [
  index("tag_assignment_product_idx").on(table.productId),
  index("tag_assignment_tag_idx").on(table.tagId),
]);

// Tag relations
export const productTagsRelations = relations(productTags, ({ many }) => ({
  assignments: many(productTagAssignments),
}));

export const productTagAssignmentsRelations = relations(productTagAssignments, ({ one }) => ({
  product: one(products, {
    fields: [productTagAssignments.productId],
    references: [products.id],
  }),
  tag: one(productTags, {
    fields: [productTagAssignments.tagId],
    references: [productTags.id],
  }),
}));

// Hero Slides for homepage carousel
export const heroSlides = sqliteTable("hero_slides", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title"),
  subtitle: text("subtitle"),
  buttonText: text("button_text"),
  buttonLink: text("button_link"),
  imageUrl: text("image_url").notNull(),
  imageAlt: text("image_alt"),
  position: integer("position").default(0),
  active: integer("active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// Type exports
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type ShippingZone = typeof shippingZones.$inferSelect;
export type ShippingRate = typeof shippingRates.$inferSelect;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type HeroSlide = typeof heroSlides.$inferSelect;
export type WeightType = typeof weightTypes.$inferSelect;
export type NewWeightType = typeof weightTypes.$inferInsert;
export type ProductTag = typeof productTags.$inferSelect;
export type NewProductTag = typeof productTags.$inferInsert;
export type ProductTagAssignment = typeof productTagAssignments.$inferSelect;
