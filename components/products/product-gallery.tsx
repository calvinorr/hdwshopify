"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/product";

interface ProductGalleryProps {
  images: ProductImage[];
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const sortedImages = [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const selectedImage = sortedImages[selectedIndex];

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
  };

  if (sortedImages.length === 0) {
    return (
      <div className="aspect-square w-full rounded-lg bg-muted flex items-center justify-center">
        <span className="text-muted-foreground font-body">No image available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogTrigger asChild>
          <button
            className="group relative aspect-square w-full overflow-hidden rounded-lg bg-secondary/30 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="View full size image"
          >
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt || "Product image"}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
            <div className="absolute bottom-4 right-4 rounded-full bg-background/90 p-2.5 opacity-0 shadow-lg backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
              <ZoomIn className="h-5 w-5 text-foreground" />
            </div>
          </button>
        </DialogTrigger>

        <DialogContent
          className="max-w-[95vw] max-h-[95vh] p-0 bg-background/95 backdrop-blur-md border-0 sm:max-w-4xl"
          showCloseButton={true}
        >
          <div className="relative aspect-square w-full sm:aspect-[4/3]">
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt || "Product image"}
              fill
              className="object-contain"
              sizes="95vw"
            />

            {/* Lightbox Navigation */}
            {sortedImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 shadow-lg backdrop-blur-sm hover:bg-background"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 shadow-lg backdrop-blur-sm hover:bg-background"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 text-sm font-body backdrop-blur-sm">
              {selectedIndex + 1} / {sortedImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Thumbnail Strip */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md transition-all duration-200 sm:h-20 sm:w-20",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                selectedIndex === index
                  ? "ring-2 ring-primary ring-offset-2"
                  : "opacity-60 hover:opacity-100"
              )}
              aria-label={`View image ${index + 1}`}
              aria-current={selectedIndex === index ? "true" : "false"}
            >
              <Image
                src={image.url}
                alt={image.alt || `Product thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
