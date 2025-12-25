import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";

const footerLinks = {
  shop: [
    { name: "All Products", href: "/collections/all" },
    { name: "Yarn", href: "/collections/yarn" },
    { name: "Mini Skeins", href: "/collections/mini-skeins" },
    { name: "Threads", href: "/collections/threads" },
    { name: "Fabric", href: "/collections/fabric" },
    { name: "Kits", href: "/collections/kits" },
  ],
  info: [
    { name: "About", href: "/about" },
    { name: "Natural Dyes", href: "/natural-dyes" },
    { name: "Dyestuffs", href: "/dyestuffs" },
    { name: "Environmental Practices", href: "/environmental" },
    { name: "Stockists", href: "/stockists" },
  ],
  help: [
    { name: "Shipping Policy", href: "/shipping" },
    { name: "Returns & Refunds", href: "/returns" },
    { name: "Contact Us", href: "/contact" },
    { name: "FAQ", href: "/faq" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-secondary/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <span className="font-heading text-xl tracking-wide">
                Herbarium Dyeworks
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              Small batch, slow-dyed yarn from Northern Ireland. Naturally dyed
              with botanical extracts for beautiful, sustainable colors.
            </p>

            {/* Newsletter signup */}
            <div className="mt-6">
              <h3 className="text-sm font-medium">Join the mailing list</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Be the first to know about new colorways and restocks.
              </p>
              <form className="mt-3 flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  className="max-w-[240px]"
                />
                <Button type="submit">Subscribe</Button>
              </form>
            </div>

            {/* Social */}
            <div className="mt-6 flex gap-4">
              <a
                href="https://instagram.com/herbariumdyeworks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="text-sm font-medium">Shop</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Links */}
          <div>
            <h3 className="text-sm font-medium">Need to Know</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.info.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h3 className="text-sm font-medium">Help</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.help.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Herbarium Dyeworks. All rights
              reserved.
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <Link href="/privacy" className="hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-primary">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
