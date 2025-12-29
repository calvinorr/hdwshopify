import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Resend } from "resend";
import { OrderConfirmationEmail } from "../lib/email/order-confirmation";

async function sendTestOrderEmail() {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: "Herbarium Dyeworks <onboarding@resend.dev>",
    to: "calvin.orr@gmail.com",
    subject: "Order Confirmation - HD-20241229-001",
    react: OrderConfirmationEmail({
      orderNumber: "HD-20241229-001",
      customerName: "Calvin",
      items: [
        {
          productName: "Hand-Dyed DK Yarn",
          colorway: "Indigo & Weld",
          quantity: 2,
          price: 18.50,
        },
        {
          productName: "Natural Laceweight",
          colorway: "Madder Root",
          quantity: 1,
          price: 22.00,
        },
      ],
      subtotal: 59.00,
      shippingCost: 3.95,
      discountAmount: 5.90,
      total: 57.05,
      shippingAddress: {
        name: "Calvin Orr",
        line1: "123 Test Street",
        city: "Belfast",
        postalCode: "BT1 1AA",
        country: "United Kingdom",
      },
      shippingMethod: "Royal Mail Tracked 48",
      orderDate: "Sunday, 29 December 2024",
    }),
  });

  if (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }

  console.log("✅ Order confirmation email sent!");
  console.log("   ID:", data?.id);
}

sendTestOrderEmail();
