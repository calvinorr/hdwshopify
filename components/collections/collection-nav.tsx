"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight, Leaf } from "lucide-react";
import { useRef, useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  position: number | null;
  children?: Category[];
}

interface CollectionNavProps {
  collections: Category[];
  currentSlug: string;
  className?: string;
}

export function CollectionNav({
  collections,
  currentSlug,
  className,
}: CollectionNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Check for horizontal scroll overflow on mobile
  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftFade(scrollLeft > 0);
        setShowRightFade(scrollLeft + clientWidth < scrollWidth - 1);
      }
    };

    const ref = scrollRef.current;
    if (ref) {
      checkScroll();
      ref.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
    }

    return () => {
      if (ref) {
        ref.removeEventListener("scroll", checkScroll);
      }
      window.removeEventListener("resize", checkScroll);
    };
  }, [collections]);

  // Check if current slug matches any collection or its children
  const isActive = (collection: Category): boolean => {
    if (collection.slug === currentSlug) return true;
    if (collection.children) {
      return collection.children.some((child) => child.slug === currentSlug);
    }
    return false;
  };

  // Get active parent for breadcrumb-style display
  const activeParent = collections.find((c) => isActive(c));

  return (
    <nav className={cn("mb-8", className)} aria-label="Collection navigation">
      {/* Mobile: Horizontal scrolling pills */}
      <div className="relative lg:hidden">
        {/* Left fade indicator */}
        {showLeftFade && (
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-background to-transparent" />
        )}

        {/* Right fade indicator */}
        {showRightFade && (
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-background to-transparent" />
        )}

        <div
          ref={scrollRef}
          className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-2"
        >
          {/* All collections link */}
          <Link
            href="/collections"
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              currentSlug === ""
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent"
            )}
          >
            <Leaf className="h-3.5 w-3.5" />
            All
          </Link>

          {collections.map((collection) => (
            <div key={collection.id} className="flex shrink-0 items-center gap-1">
              <Link
                href={`/collections/${collection.slug}`}
                className={cn(
                  "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  isActive(collection)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent"
                )}
              >
                {collection.name}
              </Link>

              {/* Show children of active parent */}
              {collection.children &&
                collection.children.length > 0 &&
                isActive(collection) && (
                  <>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {collection.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/collections/${child.slug}`}
                        className={cn(
                          "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-3 py-2 text-sm transition-colors",
                          child.slug === currentSlug
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                        )}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </>
                )}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Sidebar-style or horizontal pills with nested structure */}
      <div className="hidden lg:block">
        {/* Horizontal pills for parent categories */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/collections"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              currentSlug === ""
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent"
            )}
          >
            <Leaf className="h-3.5 w-3.5" />
            All Collections
          </Link>

          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}`}
              className={cn(
                "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                isActive(collection)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent"
              )}
            >
              {collection.name}
            </Link>
          ))}
        </div>

        {/* Nested children of active parent */}
        {activeParent?.children && activeParent.children.length > 0 && (
          <div className="mt-4 flex items-center gap-2 border-l-2 border-primary/20 pl-4">
            <span className="text-sm text-muted-foreground">
              {activeParent.name}:
            </span>
            {activeParent.children.map((child) => (
              <Link
                key={child.id}
                href={`/collections/${child.slug}`}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors",
                  child.slug === currentSlug
                    ? "border-primary/50 bg-primary/10 font-medium text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
