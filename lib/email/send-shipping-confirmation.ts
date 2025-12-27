import { resend, EMAIL_FROM, isEmailConfigured } from "../email";
import { ShippingConfirmationEmail } from "./shipping-confirmation";
import type { orders, orderItems } from "../db/schema";

type Order = typeof orders.$inferSelect;
type OrderItem = typeof orderItems.$inferSelect;

interface ShippingAddress {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export async function sendShippingConfirmationEmail(
  order: Order,
  items: OrderItem[]
): Promise<{ success: boolean; error?: string }> {
  // Check if email is configured
  if (!isEmailConfigured() || !resend) {
    console.log("Email not configured, skipping shipping confirmation email");
    return { success: false, error: "Email not configured" };
  }

  try {
    // Parse shipping address
    let shippingAddress: ShippingAddress = {};
    try {
      shippingAddress = JSON.parse(order.shippingAddress || "{}");
    } catch {
      console.error("Failed to parse shipping address");
    }

    // Get customer name from shipping address
    const customerName = shippingAddress.name?.split(" ")[0] || "";

    // Calculate estimated delivery based on shipping method
    const estimatedDelivery = getEstimatedDelivery(order.shippingMethod);

    // Send email
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: order.email,
      subject: `Your Order Has Shipped! - ${order.orderNumber}`,
      react: ShippingConfirmationEmail({
        orderNumber: order.orderNumber,
        customerName,
        items: items.map((item) => ({
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
        })),
        shippingAddress: {
          name: shippingAddress.name || "",
          line1: shippingAddress.line1 || "",
          line2: shippingAddress.line2,
          city: shippingAddress.city || "",
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode || "",
          country: shippingAddress.country || "",
        },
        shippingMethod: order.shippingMethod || "Standard Shipping",
        trackingNumber: order.trackingNumber || undefined,
        trackingUrl: order.trackingUrl || undefined,
        estimatedDelivery,
      }),
    });

    if (error) {
      console.error("Failed to send shipping confirmation email:", error);
      return { success: false, error: error.message };
    }

    console.log("Shipping confirmation email sent:", data?.id);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending shipping confirmation email:", message);
    return { success: false, error: message };
  }
}

function getEstimatedDelivery(shippingMethod: string | null): string | undefined {
  if (!shippingMethod) return undefined;

  const method = shippingMethod.toLowerCase();

  // UK methods
  if (method.includes("tracked 24") || method.includes("next day")) {
    return "1-2 business days";
  }
  if (method.includes("tracked 48")) {
    return "2-3 business days";
  }
  if (method.includes("royal mail") && !method.includes("international")) {
    return "2-4 business days";
  }

  // Ireland
  if (method.includes("an post")) {
    return "3-5 business days";
  }

  // International
  if (method.includes("international")) {
    return "5-14 business days";
  }

  // Default
  return "3-7 business days";
}
