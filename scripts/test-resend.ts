import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Resend } from "resend";

async function testResend() {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey || apiKey === "re_placeholder") {
    console.error("❌ RESEND_API_KEY not configured or still placeholder");
    process.exit(1);
  }
  
  console.log("✓ API key found:", apiKey.substring(0, 10) + "...");
  
  const resend = new Resend(apiKey);
  
  // Send test email using onboarding domain
  console.log("\nSending test email...");
  
  const { data, error } = await resend.emails.send({
    from: "Herbarium Dyeworks <onboarding@resend.dev>",
    to: "delivered@resend.dev", // Resend's test address
    subject: "Test Email from Herbarium Dyeworks",
    html: "<h1>It works!</h1><p>Email sending is configured correctly.</p>",
  });
  
  if (error) {
    console.error("❌ Failed to send:", error);
    process.exit(1);
  }
  
  console.log("✅ Test email sent successfully!");
  console.log("   Email ID:", data?.id);
  console.log("\n📧 Resend is configured and working.");
}

testResend().catch(console.error);
