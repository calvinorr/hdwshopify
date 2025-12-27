"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PolicyData {
  body: string;
  updatedAt: string;
}

interface Props {
  policies: Record<string, PolicyData>;
}

const POLICY_CONFIG = [
  {
    key: "policy_terms",
    title: "Terms of Service",
    slug: "terms",
    description: "Terms and conditions for using your store",
    defaultContent: `<h2>Agreement to Terms</h2>
<p>By accessing or using our website and services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>

<h2>Products</h2>
<p>All our yarns are hand-dyed using natural dyes. Due to the nature of this process:</p>
<ul>
<li>Colours may vary slightly between batches and from photos shown on screen</li>
<li>We recommend purchasing sufficient yarn for your project from the same dye lot when possible</li>
<li>Product weights and measurements are approximate</li>
</ul>

<h2>Orders and Payment</h2>
<p>All prices are in GBP and include VAT where applicable. We reserve the right to refuse or cancel any order. Payment is processed securely through Stripe at the time of purchase.</p>

<h2>Shipping</h2>
<p>We ship worldwide. Delivery times are estimates and not guaranteed. Risk of loss transfers to you upon delivery. For international orders, you are responsible for any customs duties or import taxes unless otherwise stated.</p>

<h2>Returns and Refunds</h2>
<p>Please see our Returns Policy for full details. In summary, we accept returns of unused items in original condition within 14 days of delivery. Custom or made-to-order items cannot be returned.</p>

<h2>Intellectual Property</h2>
<p>All content on this website, including text, images, and designs, is owned by Herbarium Dyeworks and protected by copyright. You may not reproduce or distribute our content without permission.</p>

<h2>Limitation of Liability</h2>
<p>To the fullest extent permitted by law, Herbarium Dyeworks shall not be liable for any indirect, incidental, or consequential damages arising from your use of our products or services.</p>

<h2>Governing Law</h2>
<p>These terms are governed by the laws of Northern Ireland and the United Kingdom. Any disputes shall be subject to the exclusive jurisdiction of the courts of Northern Ireland.</p>

<h2>Contact</h2>
<p>Questions about these terms? Contact us at <a href="mailto:hello@herbariumdyeworks.com">hello@herbariumdyeworks.com</a>.</p>`,
  },
  {
    key: "policy_privacy",
    title: "Privacy Policy",
    slug: "privacy",
    description: "How you collect, use, and protect customer data",
    defaultContent: `<h2>Information We Collect</h2>
<p>When you make a purchase or create an account, we collect information necessary to fulfil your order and provide customer service:</p>
<ul>
<li>Name and contact details (email, phone, address)</li>
<li>Payment information (processed securely by Stripe)</li>
<li>Order history and preferences</li>
<li>Communications with us</li>
</ul>

<h2>How We Use Your Information</h2>
<p>We use your information to:</p>
<ul>
<li>Process and fulfil your orders</li>
<li>Communicate about your orders and account</li>
<li>Send marketing communications (with your consent)</li>
<li>Improve our products and services</li>
<li>Comply with legal obligations</li>
</ul>

<h2>Data Security</h2>
<p>We take the security of your data seriously. Payment information is processed securely through Stripe and we never store your full card details. Your personal information is protected using industry-standard security measures.</p>

<h2>Your Rights</h2>
<p>Under UK GDPR, you have the right to:</p>
<ul>
<li>Access your personal data</li>
<li>Correct inaccurate data</li>
<li>Request deletion of your data</li>
<li>Object to processing</li>
<li>Data portability</li>
<li>Withdraw consent at any time</li>
</ul>

<h2>Cookies</h2>
<p>We use essential cookies to enable basic website functionality such as your shopping cart and account login. We also use analytics cookies to understand how visitors use our site, which helps us improve your experience.</p>

<h2>Contact Us</h2>
<p>If you have questions about this privacy policy or wish to exercise your rights, please contact us at <a href="mailto:hello@herbariumdyeworks.com">hello@herbariumdyeworks.com</a>.</p>`,
  },
  {
    key: "policy_returns",
    title: "Refund Policy",
    slug: "returns",
    description: "Return and refund conditions",
    defaultContent: `<h2>Returns</h2>
<p>We want you to be completely happy with your purchase. If for any reason you're not satisfied, you may return unused items in their original condition within 14 days of delivery for a full refund.</p>

<h2>Conditions</h2>
<ul>
<li>Items must be unused, unwound, and in original packaging</li>
<li>Yarn that has been wound, knitted, or crocheted cannot be returned</li>
<li>Custom or made-to-order items cannot be returned</li>
<li>Sale items are final sale unless faulty</li>
</ul>

<h2>How to Return</h2>
<p>To initiate a return, please email us at <a href="mailto:hello@herbariumdyeworks.com">hello@herbariumdyeworks.com</a> with your order number and reason for return. We'll provide you with return instructions.</p>

<h2>Return Shipping</h2>
<p>Return shipping costs are the responsibility of the customer unless the item is faulty or we made an error with your order. We recommend using a tracked shipping service.</p>

<h2>Refunds</h2>
<p>Once we receive and inspect your return, we'll process your refund within 5-7 business days. Refunds will be issued to your original payment method.</p>

<h2>Faulty Items</h2>
<p>If you receive a faulty item, please contact us immediately with photos of the issue. We'll arrange a replacement or full refund including return shipping costs.</p>

<h2>Exchanges</h2>
<p>We don't offer direct exchanges. If you'd like a different item, please return your original purchase for a refund and place a new order.</p>`,
  },
  {
    key: "policy_shipping",
    title: "Shipping Policy",
    slug: "shipping",
    description: "Shipping rates, times, and international delivery",
    defaultContent: `<h2>Processing Time</h2>
<p>Orders are typically processed within 1-3 business days. During busy periods or for made-to-order items, processing may take longer. You'll receive a shipping confirmation email with tracking information once your order ships.</p>

<h2>UK Shipping</h2>
<p>We offer the following UK shipping options:</p>
<ul>
<li><strong>Royal Mail Large Letter:</strong> £1.95 (2-4 days) - for small orders</li>
<li><strong>Royal Mail Tracked 48:</strong> £3.95 (2-4 days)</li>
<li><strong>Royal Mail Tracked 24:</strong> £5.95 (1-2 days)</li>
</ul>
<p>Free UK shipping on orders over £50.</p>

<h2>Ireland</h2>
<p>Shipping to Ireland starts at £3.25 and typically takes 3-5 business days.</p>

<h2>Europe</h2>
<p>We ship to most European countries. Shipping rates vary by destination and weight. EU orders ship from Northern Ireland, so there are no customs duties under the Windsor Framework.</p>

<h2>International</h2>
<p>We ship worldwide. International shipping rates are calculated at checkout based on destination and weight. Please note:</p>
<ul>
<li>International orders may be subject to customs duties and import taxes</li>
<li>These charges are the responsibility of the recipient</li>
<li>Delivery times vary by destination (typically 7-21 days)</li>
</ul>

<h2>Tracking</h2>
<p>All orders over £10 include tracking. You'll receive tracking information via email once your order ships.</p>

<h2>Lost or Damaged Packages</h2>
<p>If your package is lost or arrives damaged, please contact us within 14 days of the expected delivery date. We'll work with the carrier to resolve the issue.</p>`,
  },
];

export function LegalSettingsForm({ policies }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize state for each policy
  const [policyContents, setPolicyContents] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      POLICY_CONFIG.forEach((config) => {
        initial[config.key] =
          policies[config.key]?.body || config.defaultContent;
      });
      return initial;
    }
  );

  const updatePolicy = (key: string, content: string) => {
    setPolicyContents((prev) => ({ ...prev, [key]: content }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/admin/settings/legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policies: policyContents }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save policies");
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Not yet saved";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/settings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-semibold text-stone-900">
              Legal Policies
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Manage your store&apos;s legal policies
            </p>
          </div>
        </div>
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save All Policies"}
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Policies saved successfully!
        </div>
      )}

      {/* Policies Accordion */}
      <div className="bg-white rounded-lg border">
        <Accordion type="single" collapsible className="w-full">
          {POLICY_CONFIG.map((config) => (
            <AccordionItem key={config.key} value={config.key}>
              <AccordionTrigger className="px-6 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <FileText className="h-5 w-5 text-stone-400" />
                  <div>
                    <div className="font-medium text-stone-900">
                      {config.title}
                    </div>
                    <div className="text-sm text-stone-500">
                      {config.description}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
                  {/* Last updated & preview link */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">
                      Last updated: {formatDate(policies[config.key]?.updatedAt)}
                    </span>
                    <Link
                      href={`/${config.slug}`}
                      target="_blank"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      Preview
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  {/* Editor */}
                  <RichTextEditor
                    content={policyContents[config.key]}
                    onChange={(html) => updatePolicy(config.key, html)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
        <strong>Note:</strong> Changes are saved to the database and will appear
        on your public policy pages immediately after saving.
      </div>
    </form>
  );
}
