import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Resend } from "resend";
import { ShippingConfirmationEmail } from "../lib/email/shipping-confirmation";

async function sendTestShippingEmail() {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: "Herbarium Dyeworks <onboarding@resend.dev>",
    to: "calvin.orr@gmail.com",
    subject: "Your Order Has Shipped! - HD-20241229-001",
    react: ShippingConfirmationEmail({
      orderNumber: "HD-20241229-001",
      customerName: "Calvin",
      items: [
        {
          productName: "Hand-Dyed DK Yarn",
          colorway: "Indigo & Weld",
          quantity: 2,
        },
        {
          productName: "Natural Laceweight",
          colorway: "Madder Root",
          quantity: 1,
        },
      ],
      shippingAddress: {
        name: "Calvin Orr",
        line1: "123 Test Street",
        city: "Belfast",
        postalCode: "BT1 1AA",
        country: "United Kingdom",
      },
      shippingMethod: "Royal Mail Tracked 48",
      trackingNumber: "JD123456789GB",
      trackingUrl: "https://www.royalmail.com/track-your-item#/tracking-results/JD123456789GB",
      estimatedDelivery: "2-3 business days",
    }),
  });

  if (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }

  console.log("✅ Shipping confirmation email sent!");
  console.log("   ID:", data?.id);
}

sendTestShippingEmail();
