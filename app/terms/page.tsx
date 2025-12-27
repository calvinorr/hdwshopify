import { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { PolicyContent } from "@/components/shop/policy-content";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for Herbarium Dyeworks.",
};

function FallbackContent() {
  return (
    <div className="prose prose-neutral max-w-none font-body">
      <p className="text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
      </p>

      <h2 className="font-heading text-xl font-medium text-foreground mt-8 mb-4">
        1. Agreement to Terms
      </h2>
      <p className="text-muted-foreground mb-6">
        By accessing or using our website and services, you agree to be bound
        by these Terms of Service. If you do not agree, please do not use our
        services.
      </p>

      <h2 className="font-heading text-xl font-medium text-foreground mt-8 mb-4">
        2. Products
      </h2>
      <p className="text-muted-foreground mb-4">
        All our yarns are hand-dyed using natural dyes. Due to the nature of
        this process:
      </p>
      <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
        <li>
          Colours may vary slightly between batches and from photos shown on
          screen
        </li>
        <li>
          We recommend purchasing sufficient yarn for your project from the
          same dye lot when possible
        </li>
        <li>
          Product weights and measurements are approximate
        </li>
      </ul>

      <h2 className="font-heading text-xl font-medium text-foreground mt-8 mb-4">
        3. Contact
      </h2>
      <p className="text-muted-foreground">
        Questions about these terms? Contact us at{" "}
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

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-heading text-3xl md:text-4xl font-medium text-foreground mb-8">
              Terms of Service
            </h1>
            <Suspense fallback={<div className="animate-pulse h-96 bg-muted rounded" />}>
              <PolicyContent
                policyKey="policy_terms"
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
