"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Move } from "lucide-react";
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

  // Zoom state
  const [isZoomed, setIsZoomed] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const resetZoom = useCallback(() => {
    setIsZoomed(false);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomToggle = useCallback(() => {
    if (isZoomed) {
      resetZoom();
    } else {
      setIsZoomed(true);
    }
  }, [isZoomed, resetZoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isZoomed) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - panPosition.x, y: e.clientY - panPosition.y };
  }, [isZoomed, panPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !isZoomed) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    // Limit panning to reasonable bounds
    const maxPan = 300;
    setPanPosition({
      x: Math.max(-maxPan, Math.min(maxPan, newX)),
      y: Math.max(-maxPan, Math.min(maxPan, newY)),
    });
  }, [isDragging, isZoomed]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isZoomed || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: touch.clientX - panPosition.x, y: touch.clientY - panPosition.y };
  }, [isZoomed, panPosition]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !isZoomed || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.current.x;
    const newY = touch.clientY - dragStart.current.y;
    const maxPan = 300;
    setPanPosition({
      x: Math.max(-maxPan, Math.min(maxPan, newX)),
      y: Math.max(-maxPan, Math.min(maxPan, newY)),
    });
  }, [isDragging, isZoomed]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const selectedImage = sortedImages[selectedIndex];

  const goToPrevious = () => {
    resetZoom();
    setSelectedIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    resetZoom();
    setSelectedIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
  };

  // Reset zoom when lightbox closes
  const handleOpenChange = (open: boolean) => {
    setLightboxOpen(open);
    if (!open) {
      resetZoom();
    }
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
      <Dialog open={lightboxOpen} onOpenChange={handleOpenChange}>
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
          <div
            ref={containerRef}
            className={cn(
              "relative aspect-square w-full sm:aspect-[4/3] overflow-hidden select-none",
              isZoomed ? "cursor-grab" : "cursor-zoom-in",
              isDragging && "cursor-grabbing"
            )}
            onClick={!isDragging ? handleZoomToggle : undefined}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            role="button"
            tabIndex={0}
            aria-label={isZoomed ? "Click to zoom out, drag to pan" : "Click to zoom in"}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleZoomToggle();
              }
            }}
          >
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt || "Product image"}
              fill
              className={cn(
                "object-contain transition-transform duration-300 pointer-events-none",
                isZoomed && "duration-0"
              )}
              style={{
                transform: isZoomed
                  ? `scale(2.5) translate(${panPosition.x / 2.5}px, ${panPosition.y / 2.5}px)`
                  : "scale(1)",
              }}
              sizes="95vw"
              draggable={false}
            />

            {/* Zoom indicator */}
            {isZoomed && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-sm font-body backdrop-blur-sm">
                <Move className="h-4 w-4" />
                <span>Drag to pan</span>
              </div>
            )}

            {/* Lightbox Navigation */}
            {sortedImages.length > 1 && !isZoomed && (
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

            {/* Zoom toggle button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-background/80 shadow-lg backdrop-blur-sm hover:bg-background"
              onClick={(e) => {
                e.stopPropagation();
                handleZoomToggle();
              }}
              aria-label={isZoomed ? "Zoom out" : "Zoom in"}
            >
              {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
            </Button>

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
