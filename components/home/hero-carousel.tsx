"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  cta: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
  image: string;
  imageAlt: string;
  overlayPosition?: "left" | "center" | "right";
  theme?: "light" | "dark";
}

interface HeroCarouselProps {
  slides: CarouselSlide[];
  autoPlayInterval?: number;
}

export function HeroCarousel({ slides, autoPlayInterval = 6000 }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [direction, setDirection] = React.useState<"left" | "right">("right");
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const goToSlide = React.useCallback((index: number, dir?: "left" | "right") => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setDirection(dir || (index > currentSlide ? "right" : "left"));

    setTimeout(() => {
      setCurrentSlide(index);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 300);
  }, [currentSlide, isTransitioning]);

  const nextSlide = React.useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length, "right");
  }, [currentSlide, slides.length, goToSlide]);

  const prevSlide = React.useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length, "left");
  }, [currentSlide, slides.length, goToSlide]);

  // Auto-play
  React.useEffect(() => {
    if (isPlaying && !isTransitioning) {
      timerRef.current = setTimeout(nextSlide, autoPlayInterval);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentSlide, isTransitioning, autoPlayInterval, nextSlide]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, isPlaying]);

  const slide = slides[currentSlide];
  const isDark = slide.theme === "dark";

  return (
    <section
      className="relative h-[100svh] w-full overflow-hidden"
      role="region"
      aria-label="Featured products carousel"
      aria-roledescription="carousel"
    >
      {/* Background Images */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 transition-all duration-700 ease-out",
            index === currentSlide
              ? "opacity-100 scale-100"
              : direction === "right"
                ? "opacity-0 scale-105 translate-x-4"
                : "opacity-0 scale-105 -translate-x-4"
          )}
          aria-hidden={index !== currentSlide}
        >
          {/* Image */}
          <Image
            src={s.image}
            alt={s.imageAlt}
            fill
            priority={index === 0}
            className="object-cover"
            sizes="100vw"
          />

          {/* Gradient Overlays */}
          <div className={cn(
            "absolute inset-0",
            s.theme === "dark"
              ? "bg-gradient-to-r from-black/70 via-black/40 to-transparent"
              : "bg-gradient-to-r from-white/80 via-white/50 to-transparent"
          )} />

          {/* Texture overlay for depth */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMC41IiBmaWxsPSJyZ2JhKDAsMCwwLDAuMDMpIj48L2NpcmNsZT4KPC9zdmc+')] opacity-50" />
        </div>
      ))}

      {/* Content Container */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className={cn(
            "max-w-2xl",
            slide.overlayPosition === "center" && "mx-auto text-center",
            slide.overlayPosition === "right" && "ml-auto text-right"
          )}>
            {/* Animated content */}
            <div
              className={cn(
                "space-y-6 transition-all duration-500 ease-out",
                isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
              )}
            >
              {/* Subtitle badge */}
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide",
                  isDark
                    ? "bg-white/10 text-white/90 backdrop-blur-sm border border-white/20"
                    : "bg-stone-900/5 text-stone-700 backdrop-blur-sm border border-stone-900/10"
                )}
                style={{ animationDelay: "100ms" }}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                {slide.subtitle}
              </div>

              {/* Main Title */}
              <h1
                className={cn(
                  "font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[0.9]",
                  isDark ? "text-white" : "text-stone-900"
                )}
                style={{ animationDelay: "200ms" }}
              >
                {slide.title.split('\n').map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))}
              </h1>

              {/* Description */}
              <p
                className={cn(
                  "text-lg md:text-xl leading-relaxed max-w-lg",
                  isDark ? "text-white/80" : "text-stone-600",
                  slide.overlayPosition === "center" && "mx-auto",
                  slide.overlayPosition === "right" && "ml-auto"
                )}
                style={{ animationDelay: "300ms" }}
              >
                {slide.description}
              </p>

              {/* CTAs */}
              <div
                className={cn(
                  "flex flex-wrap gap-4 pt-2",
                  slide.overlayPosition === "center" && "justify-center",
                  slide.overlayPosition === "right" && "justify-end"
                )}
                style={{ animationDelay: "400ms" }}
              >
                <Button
                  size="lg"
                  className={cn(
                    "group text-base px-8 py-6 rounded-full transition-all duration-300",
                    isDark
                      ? "bg-white text-stone-900 hover:bg-white/90 hover:scale-105"
                      : "bg-stone-900 text-white hover:bg-stone-800 hover:scale-105"
                  )}
                  asChild
                >
                  <Link href={slide.cta.href}>
                    {slide.cta.text}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>

                {slide.secondaryCta && (
                  <Button
                    size="lg"
                    variant="outline"
                    className={cn(
                      "text-base px-8 py-6 rounded-full transition-all duration-300",
                      isDark
                        ? "border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                        : "border-stone-300 text-stone-700 hover:bg-stone-100"
                    )}
                    asChild
                  >
                    <Link href={slide.secondaryCta.href}>
                      {slide.secondaryCta.text}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Navigation & Indicators */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 pb-8">
          <div className="flex items-center justify-between">
            {/* Slide indicators */}
            <div className="flex items-center gap-3">
              {slides.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "group relative h-1 rounded-full transition-all duration-300 overflow-hidden",
                    index === currentSlide ? "w-12 bg-white/30" : "w-8 bg-white/20 hover:bg-white/30"
                  )}
                  aria-label={`Go to slide ${index + 1}: ${s.title}`}
                  aria-current={index === currentSlide ? "true" : undefined}
                >
                  {/* Progress bar for active slide */}
                  {index === currentSlide && isPlaying && (
                    <span
                      className="absolute inset-y-0 left-0 bg-white rounded-full"
                      style={{
                        animation: `progress ${autoPlayInterval}ms linear`,
                        animationPlayState: isTransitioning ? "paused" : "running"
                      }}
                    />
                  )}
                  {index === currentSlide && !isPlaying && (
                    <span className="absolute inset-0 bg-white rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
                aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white" />
                )}
              </button>

              <button
                onClick={prevSlide}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              <button
                onClick={nextSlide}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-2 opacity-60">
        <span className="text-white/70 text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/50 to-transparent animate-bounce" />
      </div>

      {/* CSS for progress animation */}
      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
