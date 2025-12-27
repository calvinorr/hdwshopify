import { Metadata } from "next";
import { Leaf, Recycle, Droplets, TreePine, Heart, Globe } from "lucide-react";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";

export const metadata: Metadata = {
  title: "Environmental Practices",
  description:
    "Learn about Herbarium Dyeworks' commitment to sustainable and environmentally conscious practices.",
};

export default function EnvironmentalPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-secondary/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="font-heading text-4xl md:text-5xl font-medium text-foreground mb-6">
                Our Environmental Commitment
              </h1>
              <p className="font-body text-lg text-muted-foreground leading-relaxed">
                Sustainability isn&apos;t just part of what we do &mdash; it&apos;s why
                we do it. Natural dyeing is inherently more sustainable than synthetic
                alternatives, and we strive to minimise our impact at every step.
              </p>
            </div>
          </div>
        </section>

        {/* Practices Grid */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Natural Dyes */}
              <div className="rounded-lg border p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Leaf className="h-6 w-6 text-green-700" />
                </div>
                <h3 className="font-heading text-lg font-medium text-foreground mb-2">
                  Natural Dyes
                </h3>
                <p className="font-body text-sm text-muted-foreground">
                  All our colours come from plants, roots, bark, and other natural
                  sources. No synthetic dyes, no petrochemicals, no heavy metal
                  mordants. Our dye baths are safe to return to the earth.
                </p>
              </div>

              {/* Water Conservation */}
              <div className="rounded-lg border p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Droplets className="h-6 w-6 text-blue-700" />
                </div>
                <h3 className="font-heading text-lg font-medium text-foreground mb-2">
                  Water Conservation
                </h3>
                <p className="font-body text-sm text-muted-foreground">
                  We reuse dye baths multiple times to extract every bit of colour
                  and minimise water usage. Our mordant baths are also reused and
                  refreshed rather than discarded.
                </p>
              </div>

              {/* Eco Packaging */}
              <div className="rounded-lg border p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <Recycle className="h-6 w-6 text-amber-700" />
                </div>
                <h3 className="font-heading text-lg font-medium text-foreground mb-2">
                  Plastic-Free Packaging
                </h3>
                <p className="font-body text-sm text-muted-foreground">
                  All orders ship in recyclable cardboard with paper tape. Skeins
                  are wrapped in tissue paper, not plastic. Even our labels are
                  printed on recycled paper.
                </p>
              </div>

              {/* Local Sourcing */}
              <div className="rounded-lg border p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <TreePine className="h-6 w-6 text-emerald-700" />
                </div>
                <h3 className="font-heading text-lg font-medium text-foreground mb-2">
                  Local Foraging
                </h3>
                <p className="font-body text-sm text-muted-foreground">
                  Many of our dye materials are sustainably foraged locally &mdash;
                  walnut hulls, oak galls, and seasonal plants. This reduces transport
                  emissions and connects our colours to our landscape.
                </p>
              </div>

              {/* Ethical Fibres */}
              <div className="rounded-lg border p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                  <Heart className="h-6 w-6 text-rose-700" />
                </div>
                <h3 className="font-heading text-lg font-medium text-foreground mb-2">
                  Ethical Fibres
                </h3>
                <p className="font-body text-sm text-muted-foreground">
                  We choose bases from mills with high animal welfare standards.
                  Where possible, we support UK wool and heritage breeds that
                  might otherwise be undervalued.
                </p>
              </div>

              {/* Carbon Conscious */}
              <div className="rounded-lg border p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
                  <Globe className="h-6 w-6 text-sky-700" />
                </div>
                <h3 className="font-heading text-lg font-medium text-foreground mb-2">
                  Carbon Conscious
                </h3>
                <p className="font-body text-sm text-muted-foreground">
                  We consolidate orders to reduce shipping frequency, use Royal Mail&apos;s
                  carbon-offset services, and work from a home studio to minimise
                  commuting impact.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quote Section */}
        <section className="bg-secondary/30 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <blockquote className="max-w-2xl mx-auto text-center">
              <p className="font-heading text-2xl md:text-3xl text-foreground mb-4 italic">
                &ldquo;The most sustainable product is one made with care, designed
                to last, and cherished by its owner.&rdquo;
              </p>
              <footer className="font-body text-muted-foreground">
                &mdash; Our guiding principle
              </footer>
            </blockquote>
          </div>
        </section>

        {/* Ongoing Journey */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-heading text-2xl font-medium text-foreground mb-4">
                An Ongoing Journey
              </h2>
              <p className="font-body text-muted-foreground">
                We&apos;re always looking for ways to improve our practices and reduce
                our environmental footprint. If you have suggestions or questions about
                our sustainability efforts, we&apos;d love to hear from you.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
