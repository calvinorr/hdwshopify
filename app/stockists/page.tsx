import { Metadata } from "next";
import Link from "next/link";
import { MapPin, Globe, Mail } from "lucide-react";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Stockists",
  description: "Find Herbarium Dyeworks yarns at these lovely yarn shops.",
};

const stockists = [
  {
    name: "The Yarn Kitchen",
    location: "Belfast, Northern Ireland",
    type: "Physical Store",
    website: "#",
  },
  {
    name: "Loop Knitting",
    location: "London, England",
    type: "Physical Store",
    website: "#",
  },
  {
    name: "This is Knit",
    location: "Dublin, Ireland",
    type: "Physical Store",
    website: "#",
  },
  {
    name: "Wild & Woolly",
    location: "Edinburgh, Scotland",
    type: "Physical Store",
    website: "#",
  },
];

export default function StockistsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-heading text-3xl md:text-4xl font-medium text-foreground mb-4">
              Stockists
            </h1>
            <p className="font-body text-muted-foreground mb-12 max-w-2xl">
              You can find our naturally dyed yarns at these wonderful yarn shops.
              We&apos;re proud to work with retailers who share our passion for
              quality and sustainability.
            </p>

            {/* Stockists Grid */}
            <div className="grid gap-6 md:grid-cols-2 mb-16">
              {stockists.map((stockist) => (
                <div
                  key={stockist.name}
                  className="rounded-lg border p-6 hover:border-primary/50 transition-colors"
                >
                  <h3 className="font-heading text-lg font-medium text-foreground mb-2">
                    {stockist.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    <span className="font-body">{stockist.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Globe className="h-4 w-4" />
                    <span className="font-body">{stockist.type}</span>
                  </div>
                  <a
                    href={stockist.website}
                    className="font-body text-sm text-primary hover:underline"
                  >
                    Visit website &rarr;
                  </a>
                </div>
              ))}
            </div>

            {/* Become a Stockist */}
            <section className="rounded-lg bg-secondary/50 p-8 text-center">
              <h2 className="font-heading text-2xl font-medium text-foreground mb-4">
                Become a Stockist
              </h2>
              <p className="font-body text-muted-foreground mb-6 max-w-xl mx-auto">
                Interested in carrying Herbarium Dyeworks in your shop? We&apos;d love
                to hear from you. We offer competitive wholesale pricing and support
                for our retail partners.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/contact">
                    <Mail className="mr-2 h-4 w-4" />
                    Get in Touch
                  </Link>
                </Button>
              </div>
              <p className="font-body text-xs text-muted-foreground mt-4">
                Please include &quot;Wholesale Enquiry&quot; in your subject line
              </p>
            </section>

            {/* Note */}
            <p className="font-body text-sm text-muted-foreground text-center mt-12">
              Can&apos;t find a stockist near you? You can always{" "}
              <Link href="/products" className="text-primary hover:underline">
                shop directly
              </Link>{" "}
              from our online store with worldwide shipping.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
