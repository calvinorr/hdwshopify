import { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { PolicyContent } from "@/components/shop/policy-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Herbarium Dyeworks.",
};

function FallbackContent() {
  return (
    <div className="prose prose-neutral max-w-none font-body">
      <p className="text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
      </p>

      <h2 className="font-heading text-xl font-medium text-foreground mt-8 mb-4">
        Information We Collect
      </h2>
      <p className="text-muted-foreground mb-4">
        When you make a purchase or create an account, we collect information
        necessary to fulfil your order and provide customer service.
      </p>

      <h2 className="font-heading text-xl font-medium text-foreground mt-8 mb-4">
        Contact Us
      </h2>
      <p className="text-muted-foreground">
        If you have questions about this privacy policy, please contact us at{" "}
        <a
          href="mailto:hello@herbariumdyeworks.com"
          className="text-primary hover:underline"
        >
          hello@herbariumdyeworks.com
        </a>
        .
      </p>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-heading text-3xl md:text-4xl font-medium text-foreground mb-8">
              Privacy Policy
            </h1>
            <Suspense fallback={<div className="animate-pulse h-96 bg-muted rounded" />}>
              <PolicyContent
                policyKey="policy_privacy"
                fallbackContent={<FallbackContent />}
              />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
