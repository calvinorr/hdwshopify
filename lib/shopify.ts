import { db } from "@/lib/db";
import {
  products,
  productImages,
  categories,
  customers,
  addresses,
  orders,
  orderItems,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  status: string;
  productType: string;
  vendor: string;
  tags: string[];
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
      };
    }>;
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        sku: string | null;
        price: string;
        compareAtPrice: string | null;
        inventoryQuantity: number;
        position: number;
        image: {
          url: string;
          altText: string | null;
        } | null;
        inventoryItem: {
          measurement: {
            weight: {
              value: number;
              unit: string;
            } | null;
          } | null;
        } | null;
      };
    }>;
  };
  metafields: {
    edges: Array<{
      node: {
        namespace: string;
        key: string;
        value: string;
      };
    }>;
  };
}

interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  image: {
    url: string;
    altText: string | null;
  } | null;
}

interface ShopifyCustomer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  emailMarketingConsent: {
    marketingState: string;
  } | null;
  createdAt: string;
  addresses: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    company: string | null;
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    country: string | null;
    countryCodeV2: string | null;
    phone: string | null;
  }>;
  defaultAddress: {
    id: string;
  } | null;
}

interface ShopifyOrder {
  id: string;
  name: string; // Order number like "#1001"
  email: string;
  createdAt: string;
  displayFulfillmentStatus: string;
  displayFinancialStatus: string;
  subtotalPriceSet: { shopMoney: { amount: string } };
  totalShippingPriceSet: { shopMoney: { amount: string } };
  totalDiscountsSet: { shopMoney: { amount: string } };
  totalTaxSet: { shopMoney: { amount: string } };
  totalPriceSet: { shopMoney: { amount: string } };
  currencyCode: string;
  note: string | null;
  shippingAddress: {
    firstName: string | null;
    lastName: string | null;
    company: string | null;
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    country: string | null;
    countryCodeV2: string | null;
    phone: string | null;
  } | null;
  billingAddress: {
    firstName: string | null;
    lastName: string | null;
    company: string | null;
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    country: string | null;
    countryCodeV2: string | null;
    phone: string | null;
  } | null;
  customer: {
    email: string;
  } | null;
  lineItems: {
    edges: Array<{
      node: {
        title: string;
        variantTitle: string | null;
        sku: string | null;
        quantity: number;
        originalUnitPriceSet: { shopMoney: { amount: string } };
        variant: {
          id: string;
        } | null;
      };
    }>;
  };
  fulfillments: Array<{
    createdAt: string;
    trackingInfo: Array<{
      number: string | null;
      url: string | null;
    }>;
  }>;
}

async function shopifyGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error("Shopify credentials not configured");
  }

  const response = await fetch(
    `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify API error: ${response.status} - ${text}`);
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

function extractShopifyId(gid: string): string {
  // Extract numeric ID from Shopify GID format: gid://shopify/Product/123
  const match = gid.match(/\/(\d+)$/);
  return match ? match[1] : gid;
}

function parseWeight(title: string, productType: string): string | null {
  const lowerTitle = title.toLowerCase();
  const lowerType = productType.toLowerCase();

  if (lowerTitle.includes("lace") || lowerType.includes("lace")) return "Laceweight";
  if (lowerTitle.includes("4ply") || lowerTitle.includes("4 ply") || lowerTitle.includes("fingering")) return "4ply";
  if (lowerTitle.includes("dk") || lowerType.includes("dk")) return "DK";
  if (lowerTitle.includes("aran") || lowerType.includes("aran")) return "Aran";
  if (lowerTitle.includes("worsted")) return "Worsted";
  if (lowerTitle.includes("bulky") || lowerTitle.includes("chunky")) return "Bulky";

  return null;
}

function convertWeightToGrams(weight: number, unit: string): number {
  switch (unit.toUpperCase()) {
    case "GRAMS":
      return Math.round(weight);
    case "KILOGRAMS":
      return Math.round(weight * 1000);
    case "OUNCES":
      return Math.round(weight * 28.3495);
    case "POUNDS":
      return Math.round(weight * 453.592);
    default:
      return Math.round(weight);
  }
}

export interface MigrationOptions {
  limit?: number;
  activeOnly?: boolean;
  clearExisting?: boolean;
}

export interface MigrationResult {
  productsImported: number;
  variantsImported: number;
  imagesImported: number;
  collectionsImported: number;
  errors: string[];
}

export async function clearAllProducts(): Promise<void> {
  // Delete in order due to foreign key constraints
  await db.delete(productImages);
  await db.delete(products);
  // Reset auto-increment (SQLite specific)
  await db.run(sql`DELETE FROM sqlite_sequence WHERE name='products'`);
  await db.run(sql`DELETE FROM sqlite_sequence WHERE name='product_images'`);
}

export async function migrateCollections(): Promise<number> {
  const query = `
    query GetCollections($first: Int!) {
      collections(first: $first) {
        edges {
          node {
            id
            title
            handle
            description
            image {
              url
              altText
            }
          }
        }
      }
    }
  `;

  const data = await shopifyGraphQL<{
    collections: { edges: Array<{ node: ShopifyCollection }> };
  }>(query, { first: 50 });

  let imported = 0;

  for (const edge of data.collections.edges) {
    const collection = edge.node;
    const shopifyId = extractShopifyId(collection.id);

    // Check if collection already exists
    const existing = await db.query.categories.findFirst({
      where: eq(categories.slug, collection.handle),
    });

    if (existing) {
      // Update existing
      await db
        .update(categories)
        .set({
          name: collection.title,
          description: collection.description || null,
          image: collection.image?.url || null,
          shopifyCollectionId: shopifyId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(categories.id, existing.id));
    } else {
      // Insert new
      await db.insert(categories).values({
        name: collection.title,
        slug: collection.handle,
        description: collection.description || null,
        image: collection.image?.url || null,
        shopifyCollectionId: shopifyId,
        position: imported,
      });
    }
    imported++;
  }

  return imported;
}

export async function migrateFromShopify(
  options: MigrationOptions = {}
): Promise<MigrationResult> {
  const { limit = 250, activeOnly = true, clearExisting = false } = options;

  const result: MigrationResult = {
    productsImported: 0,
    variantsImported: 0,
    imagesImported: 0,
    collectionsImported: 0,
    errors: [],
  };

  try {
    // Optionally clear existing data
    if (clearExisting) {
      await clearAllProducts();
    }

    // First, import collections
    result.collectionsImported = await migrateCollections();

    // Fetch products from Shopify
    const statusFilter = activeOnly ? "status:active" : "";
    const query = `
      query GetProducts($first: Int!, $query: String) {
        products(first: $first, query: $query) {
          edges {
            node {
              id
              title
              handle
              descriptionHtml
              status
              productType
              vendor
              tags
              images(first: 20) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 100) {
                edges {
                  node {
                    id
                    title
                    sku
                    price
                    compareAtPrice
                    inventoryQuantity
                    position
                    image {
                      url
                      altText
                    }
                    inventoryItem {
                      measurement {
                        weight {
                          value
                          unit
                        }
                      }
                    }
                  }
                }
              }
              metafields(first: 20) {
                edges {
                  node {
                    namespace
                    key
                    value
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await shopifyGraphQL<{
      products: { edges: Array<{ node: ShopifyProduct }> };
    }>(query, { first: limit, query: statusFilter || null });

    for (const edge of data.products.edges) {
      try {
        const shopifyProduct = edge.node;
        const shopifyId = extractShopifyId(shopifyProduct.id);

        // Extract metafields for yarn-specific info
        const metafields = shopifyProduct.metafields.edges.reduce(
          (acc, { node }) => {
            acc[`${node.namespace}.${node.key}`] = node.value;
            return acc;
          },
          {} as Record<string, string>
        );

        // Find matching category
        let categoryId: number | null = null;
        const weight = parseWeight(shopifyProduct.title, shopifyProduct.productType);

        if (weight) {
          const category = await db.query.categories.findFirst({
            where: eq(categories.name, weight),
          });
          if (category) {
            categoryId = category.id;
          }
        }

        // Check if product already exists
        const existingProduct = await db.query.products.findFirst({
          where: eq(products.shopifyId, shopifyId),
        });

        let productId: number;

        // Get first variant data for product pricing/stock
        const firstVariant = shopifyProduct.variants.edges[0]?.node;
        let weightGrams = 100;
        if (firstVariant?.inventoryItem?.measurement?.weight) {
          weightGrams = convertWeightToGrams(
            firstVariant.inventoryItem.measurement.weight.value,
            firstVariant.inventoryItem.measurement.weight.unit
          );
        }

        const productData = {
          name: shopifyProduct.title,
          slug: shopifyProduct.handle,
          description: shopifyProduct.descriptionHtml || null,
          categoryId,
          price: parseFloat(firstVariant?.price || "0"),
          compareAtPrice: firstVariant?.compareAtPrice
            ? parseFloat(firstVariant.compareAtPrice)
            : null,
          stock: Math.max(0, firstVariant?.inventoryQuantity || 0),
          sku: firstVariant?.sku || null,
          weightGrams,
          status: (shopifyProduct.status.toLowerCase() === "active" ? "active" : "draft") as "active" | "draft",
          featured: false,
          fiberContent: metafields["custom.fiber_content"] || null,
          weight: weight || metafields["custom.weight"] || null,
          yardage: metafields["custom.yardage"] || null,
          careInstructions: metafields["custom.care_instructions"] || null,
          shopifyId,
          updatedAt: new Date().toISOString(),
        };

        if (existingProduct) {
          // Update existing product
          await db
            .update(products)
            .set(productData)
            .where(eq(products.id, existingProduct.id));
          productId = existingProduct.id;

          // Delete existing images to replace them
          await db.delete(productImages).where(eq(productImages.productId, productId));
        } else {
          // Insert new product
          const [inserted] = await db
            .insert(products)
            .values({
              ...productData,
              createdAt: new Date().toISOString(),
            })
            .returning({ id: products.id });
          productId = inserted.id;
        }

        result.productsImported++;

        // Import images
        let imagePosition = 0;
        for (const imageEdge of shopifyProduct.images.edges) {
          const image = imageEdge.node;

          await db.insert(productImages).values({
            productId,
            url: image.url,
            alt: image.altText || shopifyProduct.title,
            position: imagePosition++,
            createdAt: new Date().toISOString(),
          });

          result.imagesImported++;
        }
      } catch (productError) {
        const errorMessage =
          productError instanceof Error ? productError.message : String(productError);
        result.errors.push(`Product ${edge.node.title}: ${errorMessage}`);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Migration failed: ${errorMessage}`);
  }

  return result;
}

export async function importSampleProducts(count: number = 20): Promise<MigrationResult> {
  return migrateFromShopify({ limit: count, activeOnly: true });
}

// Customer Migration
export interface CustomerMigrationOptions {
  limit?: number;
}

export interface CustomerMigrationResult {
  customersImported: number;
  customersSkipped: number;
  addressesImported: number;
  errors: string[];
}

export async function migrateCustomers(
  options: CustomerMigrationOptions = {}
): Promise<CustomerMigrationResult> {
  const { limit = 250 } = options;

  const result: CustomerMigrationResult = {
    customersImported: 0,
    customersSkipped: 0,
    addressesImported: 0,
    errors: [],
  };

  try {
    // Fetch customers from Shopify using GraphQL
    const query = `
      query GetCustomers($first: Int!) {
        customers(first: $first) {
          edges {
            node {
              id
              email
              firstName
              lastName
              phone
              emailMarketingConsent {
                marketingState
              }
              createdAt
              addresses(first: 10) {
                id
                firstName
                lastName
                company
                address1
                address2
                city
                province
                zip
                country
                countryCodeV2
                phone
              }
              defaultAddress {
                id
              }
            }
          }
        }
      }
    `;

    const data = await shopifyGraphQL<{
      customers: { edges: Array<{ node: ShopifyCustomer }> };
    }>(query, { first: limit });

    for (const edge of data.customers.edges) {
      try {
        const shopifyCustomer = edge.node;
        const email = shopifyCustomer.email?.toLowerCase();

        if (!email) {
          result.errors.push(`Customer ${shopifyCustomer.id}: No email address`);
          continue;
        }

        // Check if customer already exists by email
        const existingCustomer = await db.query.customers.findFirst({
          where: eq(customers.email, email),
        });

        let customerId: number;

        if (existingCustomer) {
          // Update existing customer (merge data)
          const acceptsMarketing = shopifyCustomer.emailMarketingConsent?.marketingState === "SUBSCRIBED";
          await db
            .update(customers)
            .set({
              firstName: shopifyCustomer.firstName || existingCustomer.firstName,
              lastName: shopifyCustomer.lastName || existingCustomer.lastName,
              phone: shopifyCustomer.phone || existingCustomer.phone,
              acceptsMarketing,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(customers.id, existingCustomer.id));

          customerId = existingCustomer.id;
          result.customersSkipped++;
        } else {
          // Insert new customer
          const acceptsMarketing = shopifyCustomer.emailMarketingConsent?.marketingState === "SUBSCRIBED";
          const [inserted] = await db
            .insert(customers)
            .values({
              email,
              firstName: shopifyCustomer.firstName,
              lastName: shopifyCustomer.lastName,
              phone: shopifyCustomer.phone,
              acceptsMarketing,
              createdAt: shopifyCustomer.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .returning({ id: customers.id });

          customerId = inserted.id;
          result.customersImported++;
        }

        // Import addresses
        const defaultAddressId = shopifyCustomer.defaultAddress?.id;

        for (const addr of shopifyCustomer.addresses) {
          // Skip if missing required fields
          if (!addr.address1 || !addr.city || !addr.zip || !addr.countryCodeV2) {
            continue;
          }

          await db.insert(addresses).values({
            customerId,
            type: "shipping",
            firstName: addr.firstName || shopifyCustomer.firstName || "",
            lastName: addr.lastName || shopifyCustomer.lastName || "",
            company: addr.company,
            line1: addr.address1,
            line2: addr.address2,
            city: addr.city,
            state: addr.province,
            postalCode: addr.zip,
            country: addr.countryCodeV2,
            phone: addr.phone,
            isDefault: addr.id === defaultAddressId,
            createdAt: new Date().toISOString(),
          });

          result.addressesImported++;
        }
      } catch (customerError) {
        const errorMessage =
          customerError instanceof Error ? customerError.message : String(customerError);
        result.errors.push(`Customer ${edge.node.email}: ${errorMessage}`);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Customer migration failed: ${errorMessage}`);
  }

  return result;
}

export async function clearAllCustomers(): Promise<void> {
  // Delete addresses first due to foreign key constraints
  await db.delete(addresses);
  await db.delete(customers);
  // Reset auto-increment (SQLite specific)
  await db.run(sql`DELETE FROM sqlite_sequence WHERE name='customers'`);
  await db.run(sql`DELETE FROM sqlite_sequence WHERE name='addresses'`);
}

// Order Migration
export interface OrderMigrationOptions {
  limit?: number;
}

export interface OrderMigrationResult {
  ordersImported: number;
  ordersSkipped: number;
  orderItemsImported: number;
  errors: string[];
}

function mapFulfillmentStatus(status: string): "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded" | "on-hold" {
  const statusLower = status.toLowerCase();
  if (statusLower === "fulfilled") return "delivered";
  if (statusLower === "partially_fulfilled" || statusLower === "partial") return "shipped";
  if (statusLower === "unfulfilled") return "processing";
  if (statusLower === "on_hold") return "on-hold";
  return "pending";
}

function mapPaymentStatus(status: string): "pending" | "paid" | "failed" | "refunded" {
  const statusLower = status.toLowerCase();
  if (statusLower === "paid") return "paid";
  if (statusLower === "refunded" || statusLower === "partially_refunded") return "refunded";
  if (statusLower === "pending" || statusLower === "authorized") return "pending";
  return "pending";
}

function formatAddress(addr: ShopifyOrder["shippingAddress"]): string {
  if (!addr) return "{}";
  return JSON.stringify({
    firstName: addr.firstName || "",
    lastName: addr.lastName || "",
    company: addr.company || "",
    line1: addr.address1 || "",
    line2: addr.address2 || "",
    city: addr.city || "",
    state: addr.province || "",
    postalCode: addr.zip || "",
    country: addr.countryCodeV2 || addr.country || "",
    phone: addr.phone || "",
  });
}

export async function migrateOrders(
  options: OrderMigrationOptions = {}
): Promise<OrderMigrationResult> {
  const { limit = 250 } = options;

  const result: OrderMigrationResult = {
    ordersImported: 0,
    ordersSkipped: 0,
    orderItemsImported: 0,
    errors: [],
  };

  try {
    // Fetch orders from Shopify using GraphQL
    const query = `
      query GetOrders($first: Int!) {
        orders(first: $first, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              email
              createdAt
              displayFulfillmentStatus
              displayFinancialStatus
              subtotalPriceSet { shopMoney { amount } }
              totalShippingPriceSet { shopMoney { amount } }
              totalDiscountsSet { shopMoney { amount } }
              totalTaxSet { shopMoney { amount } }
              totalPriceSet { shopMoney { amount } }
              currencyCode
              note
              shippingAddress {
                firstName
                lastName
                company
                address1
                address2
                city
                province
                zip
                country
                countryCodeV2
                phone
              }
              billingAddress {
                firstName
                lastName
                company
                address1
                address2
                city
                province
                zip
                country
                countryCodeV2
                phone
              }
              customer {
                email
              }
              lineItems(first: 50) {
                edges {
                  node {
                    title
                    variantTitle
                    sku
                    quantity
                    originalUnitPriceSet { shopMoney { amount } }
                    variant {
                      id
                    }
                  }
                }
              }
              fulfillments {
                createdAt
                trackingInfo {
                  number
                  url
                }
              }
            }
          }
        }
      }
    `;

    const data = await shopifyGraphQL<{
      orders: { edges: Array<{ node: ShopifyOrder }> };
    }>(query, { first: limit });

    for (const edge of data.orders.edges) {
      try {
        const shopifyOrder = edge.node;
        const orderNumber = shopifyOrder.name; // e.g., "#1001"

        // Check if order already exists by order number
        const existingOrder = await db.query.orders.findFirst({
          where: eq(orders.orderNumber, orderNumber),
        });

        if (existingOrder) {
          result.ordersSkipped++;
          continue;
        }

        // Find customer by email
        let customerId: number | null = null;
        const customerEmail = shopifyOrder.customer?.email || shopifyOrder.email;
        if (customerEmail) {
          const customer = await db.query.customers.findFirst({
            where: eq(customers.email, customerEmail.toLowerCase()),
          });
          if (customer) {
            customerId = customer.id;
          }
        }

        // Get tracking info from fulfillments
        let trackingNumber: string | null = null;
        let trackingUrl: string | null = null;
        let shippedAt: string | null = null;

        if (shopifyOrder.fulfillments && shopifyOrder.fulfillments.length > 0) {
          const latestFulfillment = shopifyOrder.fulfillments[0];
          shippedAt = latestFulfillment.createdAt;
          if (latestFulfillment.trackingInfo && latestFulfillment.trackingInfo.length > 0) {
            trackingNumber = latestFulfillment.trackingInfo[0].number;
            trackingUrl = latestFulfillment.trackingInfo[0].url;
          }
        }

        // Insert order
        const [insertedOrder] = await db
          .insert(orders)
          .values({
            orderNumber,
            customerId,
            email: shopifyOrder.email,
            status: mapFulfillmentStatus(shopifyOrder.displayFulfillmentStatus),
            paymentStatus: mapPaymentStatus(shopifyOrder.displayFinancialStatus),
            subtotal: parseFloat(shopifyOrder.subtotalPriceSet.shopMoney.amount),
            shippingCost: parseFloat(shopifyOrder.totalShippingPriceSet.shopMoney.amount),
            discountAmount: parseFloat(shopifyOrder.totalDiscountsSet.shopMoney.amount),
            taxAmount: parseFloat(shopifyOrder.totalTaxSet.shopMoney.amount),
            total: parseFloat(shopifyOrder.totalPriceSet.shopMoney.amount),
            currency: shopifyOrder.currencyCode,
            shippingAddress: formatAddress(shopifyOrder.shippingAddress),
            billingAddress: formatAddress(shopifyOrder.billingAddress),
            trackingNumber,
            trackingUrl,
            customerNotes: shopifyOrder.note,
            createdAt: shopifyOrder.createdAt,
            updatedAt: new Date().toISOString(),
            shippedAt,
          })
          .returning({ id: orders.id });

        result.ordersImported++;

        // Import line items
        for (const itemEdge of shopifyOrder.lineItems.edges) {
          const item = itemEdge.node;

          // Try to find product by SKU
          let productId: number | null = null;
          if (item.sku) {
            const product = await db.query.products.findFirst({
              where: eq(products.sku, item.sku),
            });
            if (product) {
              productId = product.id;
            }
          }

          // Weight is not available in current API version, default to null
          const weightGrams: number | null = null;

          await db.insert(orderItems).values({
            orderId: insertedOrder.id,
            productId,
            productName: item.title,
            colorway: item.variantTitle,
            sku: item.sku,
            quantity: item.quantity,
            price: parseFloat(item.originalUnitPriceSet.shopMoney.amount),
            weightGrams,
            createdAt: new Date().toISOString(),
          });

          result.orderItemsImported++;
        }
      } catch (orderError) {
        const errorMessage =
          orderError instanceof Error ? orderError.message : String(orderError);
        result.errors.push(`Order ${edge.node.name}: ${errorMessage}`);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Order migration failed: ${errorMessage}`);
  }

  return result;
}

export async function clearAllOrders(): Promise<void> {
  // Delete order items first due to foreign key constraints
  await db.delete(orderItems);
  await db.delete(orders);
  // Reset auto-increment (SQLite specific)
  await db.run(sql`DELETE FROM sqlite_sequence WHERE name='orders'`);
  await db.run(sql`DELETE FROM sqlite_sequence WHERE name='order_items'`);
}
