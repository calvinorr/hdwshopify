"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, ShoppingBag, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchInput } from "@/components/search";
import { UserMenu } from "./user-menu";
import { useCart } from "@/contexts/cart-context";

const defaultCollections = [
  { name: "All Collections", href: "/collections" },
  { name: "Laceweight", href: "/collections/laceweight" },
  { name: "4 Ply", href: "/collections/4ply" },
  { name: "DK", href: "/collections/dk" },
  { name: "Aran", href: "/collections/aran" },
  { name: "Mini Skeins", href: "/collections/mini-skeins" },
];

interface CollectionLink {
  name: string;
  href: string;
  featured?: boolean;
}

const infoLinks = [
  { name: "About", href: "/about" },
  { name: "Natural Dyes", href: "/natural-dyes" },
  { name: "Shipping", href: "/shipping" },
  { name: "Contact", href: "/contact" },
];

interface HeaderProps {
  transparent?: boolean;
  announcementText?: string;
  announcementEnabled?: boolean;
  collections?: CollectionLink[];
}

export function Header({
  transparent: propTransparent,
  announcementText = "Free UK shipping on orders over £50",
  announcementEnabled = true,
  collections: propCollections,
}: HeaderProps) {
  // Use provided collections or fall back to defaults
  const collections: CollectionLink[] = propCollections?.length
    ? [{ name: "All Collections", href: "/collections" }, ...propCollections]
    : defaultCollections;
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Determine if we should use transparent mode
  const isHomePage = pathname === "/";
  const shouldBeTransparent = propTransparent ?? isHomePage;

  // Track scroll position for transparent header
  useEffect(() => {
    if (!shouldBeTransparent) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [shouldBeTransparent]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const isTransparent = shouldBeTransparent && !scrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isTransparent
          ? "bg-transparent"
          : "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm"
      )}
    >
      {/* Announcement Bar - hide when transparent or disabled */}
      {announcementEnabled && (
        <div
          className={cn(
            "px-4 py-2 text-center text-sm transition-all duration-300 overflow-hidden",
            isTransparent
              ? "h-0 opacity-0"
              : "h-auto opacity-100 bg-primary text-primary-foreground"
          )}
        >
          <p className="font-body">{announcementText}</p>
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile menu button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "shrink-0 transition-colors",
                  isTransparent && "text-white hover:bg-white/10"
                )}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  href="/products"
                  className="text-lg font-heading hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Shop All
                </Link>

                <div>
                  <span className="text-lg font-heading text-foreground">
                    Collections
                  </span>
                  <div className="ml-4 mt-2 flex flex-col gap-2">
                    {collections.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="text-sm font-body text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  {infoLinks.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block py-2 text-sm font-body text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

                <div className="border-t pt-4 mt-4">
                  <UserMenu
                    isMobile
                    onMobileClose={() => setMobileMenuOpen(false)}
                  />
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <span
              className={cn(
                "font-heading text-xl md:text-2xl tracking-wide transition-colors",
                isTransparent ? "text-white" : "text-foreground"
              )}
            >
              Herbarium Dyeworks
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex lg:items-center lg:gap-8">
            <Link
              href="/products"
              className={cn(
                "text-sm font-body font-medium transition-colors",
                isTransparent
                  ? "text-white/90 hover:text-white"
                  : "text-foreground hover:text-primary"
              )}
            >
              Shop
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1 text-sm font-body font-medium transition-colors",
                    isTransparent
                      ? "text-white/90 hover:text-white"
                      : "text-foreground hover:text-primary"
                  )}
                >
                  Collections
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {collections.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link href={item.href} className="w-full font-body">
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/about"
              className={cn(
                "text-sm font-body font-medium transition-colors",
                isTransparent
                  ? "text-white/90 hover:text-white"
                  : "text-foreground hover:text-primary"
              )}
            >
              About
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Search - desktop */}
            <div className="hidden sm:block">
              <SearchInput
                onSearch={handleSearch}
                placeholder="Search yarns..."
                className={cn(
                  "w-48 lg:w-56 transition-all",
                  isTransparent && "[&_input]:bg-white/10 [&_input]:border-white/20 [&_input]:text-white [&_input]:placeholder:text-white/60 [&_svg]:text-white/70"
                )}
              />
            </div>

            {/* Search - mobile */}
            <div className="sm:hidden">
              <SearchInput
                onSearch={handleSearch}
                placeholder="Search..."
                expandable
                className={cn(
                  isTransparent && "[&_button]:text-white [&_button]:hover:bg-white/10"
                )}
              />
            </div>

            {/* User account */}
            <UserMenu isTransparent={isTransparent} />

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "relative shrink-0 transition-colors",
                isTransparent && "text-white hover:bg-white/10"
              )}
              asChild
            >
              <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                <span className="sr-only">Cart ({itemCount} items)</span>
                {itemCount > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1 h-4 w-4 rounded-full text-[10px] font-medium flex items-center justify-center",
                      isTransparent
                        ? "bg-white text-stone-900"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
