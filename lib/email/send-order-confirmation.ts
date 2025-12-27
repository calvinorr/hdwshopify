import { resend, EMAIL_FROM, isEmailConfigured } from "../email";
import { OrderConfirmationEmail } from "./order-confirmation";
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

export async function sendOrderConfirmationEmail(
  order: Order,
  items: OrderItem[]
): Promise<{ success: boolean; error?: string }> {
  // Check if email is configured
  if (!isEmailConfigured() || !resend) {
    console.log("Email not configured, skipping order confirmation email");
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

    // Format order date
    const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Get customer name from shipping address
    const customerName = shippingAddress.name?.split(" ")[0] || "";

    // Send email
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: order.email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      react: OrderConfirmationEmail({
        orderNumber: order.orderNumber,
        customerName,
        items: items.map((item) => ({
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        discountAmount: order.discountAmount ?? 0,
        total: order.total,
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
        orderDate,
      }),
    });

    if (error) {
      console.error("Failed to send order confirmation email:", error);
      return { success: false, error: error.message };
    }

    console.log("Order confirmation email sent:", data?.id);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending order confirmation email:", message);
    return { success: false, error: message };
  }
}
