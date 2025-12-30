/**
 * Seeds a comprehensive GDPR-compliant privacy policy
 * Run with: DATABASE_URL=... DATABASE_AUTH_TOKEN=... npx tsx scripts/seed-privacy-policy.ts
 */

import { db } from "../lib/db";
import { siteSettings } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const privacyPolicyHtml = `
<h2>Introduction</h2>
<p>Herbarium Dyeworks ("we", "us", "our") is committed to protecting your privacy. This policy explains how we collect, use, and protect your personal information when you use our website and services.</p>

<h2>Information We Collect</h2>
<p>We collect information you provide directly to us:</p>
<ul>
  <li><strong>Account information:</strong> Email address, name, and password when you create an account</li>
  <li><strong>Order information:</strong> Shipping and billing addresses, phone number, and order history</li>
  <li><strong>Payment information:</strong> We do not store your payment card details - these are processed securely by Stripe</li>
  <li><strong>Communications:</strong> Any messages you send us via email or contact forms</li>
  <li><strong>Marketing preferences:</strong> Whether you've opted in to receive marketing emails</li>
</ul>

<h2>How We Use Your Information</h2>
<p>We use your information to:</p>
<ul>
  <li>Process and fulfil your orders</li>
  <li>Send order confirmations and shipping updates</li>
  <li>Respond to your enquiries and provide customer support</li>
  <li>Send marketing communications (only if you've opted in)</li>
  <li>Improve our website and services</li>
  <li>Comply with legal obligations</li>
</ul>

<h2>Legal Basis for Processing</h2>
<p>We process your data based on:</p>
<ul>
  <li><strong>Contract:</strong> Processing necessary to fulfil your orders</li>
  <li><strong>Consent:</strong> Marketing emails (you can withdraw consent at any time)</li>
  <li><strong>Legitimate interest:</strong> Improving our services and preventing fraud</li>
  <li><strong>Legal obligation:</strong> Tax records and legal compliance</li>
</ul>

<h2>How Long We Keep Your Data</h2>
<ul>
  <li><strong>Account data:</strong> Until you delete your account</li>
  <li><strong>Order history:</strong> 7 years (for tax and legal purposes)</li>
  <li><strong>Marketing preferences:</strong> Until you unsubscribe</li>
  <li><strong>Customer enquiries:</strong> 2 years after resolution</li>
</ul>

<h2>Third Parties We Share Data With</h2>
<p>We share your information only with trusted service providers who help us run our business:</p>
<ul>
  <li><strong>Stripe:</strong> Payment processing - they receive your payment details to process transactions securely</li>
  <li><strong>Royal Mail / Couriers:</strong> Shipping providers receive your delivery address to fulfil orders</li>
  <li><strong>Clerk:</strong> Authentication service that securely manages your login</li>
  <li><strong>Resend:</strong> Email service that sends order confirmations and shipping updates</li>
  <li><strong>Vercel:</strong> Website hosting</li>
</ul>
<p>We do not sell your personal data to third parties.</p>

<h2>Your Rights</h2>
<p>Under GDPR, you have the right to:</p>
<ul>
  <li><strong>Access:</strong> Request a copy of your personal data</li>
  <li><strong>Rectification:</strong> Correct inaccurate personal data</li>
  <li><strong>Erasure:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
  <li><strong>Restriction:</strong> Request we limit how we use your data</li>
  <li><strong>Portability:</strong> Receive your data in a portable format</li>
  <li><strong>Object:</strong> Object to processing based on legitimate interests</li>
  <li><strong>Withdraw consent:</strong> Withdraw marketing consent at any time</li>
</ul>
<p>To exercise any of these rights, please contact us at <a href="mailto:hello@herbariumdyeworks.com">hello@herbariumdyeworks.com</a>.</p>

<h2>Cookies</h2>
<p>We use cookies to:</p>
<ul>
  <li><strong>Essential cookies:</strong> Remember your shopping cart and keep you logged in</li>
  <li><strong>Preference cookies:</strong> Remember your cookie consent choice</li>
</ul>
<p>We only set non-essential cookies after you've given consent via our cookie banner.</p>

<h2>Data Security</h2>
<p>We protect your data using:</p>
<ul>
  <li>HTTPS encryption for all data in transit</li>
  <li>Secure, authenticated database access</li>
  <li>Payment processing handled by PCI-compliant Stripe</li>
</ul>

<h2>International Transfers</h2>
<p>Some of our service providers may process data outside the UK/EEA. Where this happens, we ensure appropriate safeguards are in place (such as Standard Contractual Clauses).</p>

<h2>Changes to This Policy</h2>
<p>We may update this policy from time to time. We'll notify you of significant changes by email or a notice on our website.</p>

<h2>Contact Us</h2>
<p>If you have questions about this policy or your personal data:</p>
<ul>
  <li>Email: <a href="mailto:hello@herbariumdyeworks.com">hello@herbariumdyeworks.com</a></li>
  <li>Address: Herbarium Dyeworks, Northern Ireland</li>
</ul>
<p>You also have the right to lodge a complaint with the Information Commissioner's Office (ICO) at <a href="https://ico.org.uk">ico.org.uk</a>.</p>
`.trim();

async function seedPrivacyPolicy() {
  console.log("Seeding privacy policy...");

  const policyData = {
    body: privacyPolicyHtml,
    updatedAt: new Date().toISOString(),
  };

  // Check if exists
  const existing = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.key, "policy_privacy"),
  });

  if (existing) {
    await db
      .update(siteSettings)
      .set({
        value: JSON.stringify(policyData),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(siteSettings.key, "policy_privacy"));
    console.log("✅ Privacy policy updated");
  } else {
    await db.insert(siteSettings).values({
      key: "policy_privacy",
      value: JSON.stringify(policyData),
      updatedAt: new Date().toISOString(),
    });
    console.log("✅ Privacy policy created");
  }

  process.exit(0);
}

seedPrivacyPolicy().catch(console.error);
