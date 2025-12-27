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
  cta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
  image: string;
  imageAlt: string;
}

interface HeroCarouselProps {
  slides: CarouselSlide[];
  autoPlayInterval?: number;
  backgroundImage?: string;
  backgroundOverlay?: string;
}

export function HeroCarousel({
  slides,
  autoPlayInterval = 6000,
  backgroundImage,
  backgroundOverlay = "rgba(0,0,0,0.4)",
}: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const goToSlide = React.useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentSlide(index);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 300);
  }, [isTransitioning]);

  const nextSlide = React.useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  const prevSlide = React.useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  // Auto-play
  React.useEffect(() => {
    if (isPlaying && !isTransitioning && slides.length > 1) {
      timerRef.current = setTimeout(nextSlide, autoPlayInterval);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentSlide, isTransitioning, autoPlayInterval, nextSlide, slides.length]);

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

  // Default background if none provided
  const defaultBg = "https://cdn.shopify.com/s/files/1/0838/1127/0999/files/20240716_124322950_iOS.jpg?v=1721204126";

  return (
    <section
      className="relative h-[100svh] w-full overflow-hidden"
      role="region"
      aria-label="Featured products carousel"
      aria-roledescription="carousel"
    >
      {/* Fixed Background Image */}
      <div className="absolute inset-0">
        <Image
          src={backgroundImage || defaultBg}
          alt="Background"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: backgroundOverlay }}
        />
        {/* Texture overlay for depth */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMC41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIj48L2NpcmNsZT4KPC9zdmc+')] opacity-50" />
      </div>

      {/* Centered Carousel Container */}
      <div className="relative z-10 h-full flex items-center justify-center px-6">
        <div className="w-full max-w-6xl">
          {/* Carousel Card */}
          <div className="relative bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
            {/* Inner content wrapper */}
            <div className="flex flex-col md:flex-row min-h-[400px] md:min-h-[500px]">
              {/* Image side */}
              <div className="relative md:w-1/2 aspect-square md:aspect-auto">
                {slides.map((s, index) => (
                  <div
                    key={s.id}
                    className={cn(
                      "absolute inset-0 transition-opacity duration-500",
                      index === currentSlide ? "opacity-100" : "opacity-0"
                    )}
                    aria-hidden={index !== currentSlide}
                  >
                    <Image
                      src={s.image}
                      alt={s.imageAlt}
                      fill
                      priority={index === 0}
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                ))}

                {/* Image overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/20 md:block hidden" />
              </div>

              {/* Content side */}
              <div className="relative md:w-1/2 flex flex-col justify-center p-8 md:p-12 lg:p-16">
                <div
                  className={cn(
                    "space-y-6 transition-all duration-500 ease-out",
                    isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                  )}
                >
                  {/* Subtitle badge */}
                  {slide.subtitle && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide bg-white/20 text-white/90 backdrop-blur-sm border border-white/30">
                      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                      {slide.subtitle}
                    </div>
                  )}

                  {/* Main Title */}
                  <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-white">
                    {slide.title.split('\n').map((line, i) => (
                      <span key={i} className="block">{line}</span>
                    ))}
                  </h1>

                  {/* Description */}
                  {slide.description && (
                    <p className="text-lg leading-relaxed text-white/80 max-w-md">
                      {slide.description}
                    </p>
                  )}

                  {/* CTAs */}
                  <div className="flex flex-wrap gap-4 pt-2">
                    {slide.cta && (
                      <Button
                        size="lg"
                        className="group text-base px-8 py-6 rounded-full bg-white text-stone-900 hover:bg-white/90 hover:scale-105 transition-all duration-300"
                        asChild
                      >
                        <Link href={slide.cta.href}>
                          {slide.cta.text}
                          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                    )}

                    {slide.secondaryCta && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="text-base px-8 py-6 rounded-full border-white/30 bg-transparent text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
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

            {/* Navigation - Bottom of card */}
            {slides.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/30 to-transparent">
                <div className="flex items-center justify-between">
                  {/* Slide indicators */}
                  <div className="flex items-center gap-3">
                    {slides.map((s, index) => (
                      <button
                        key={s.id}
                        onClick={() => goToSlide(index)}
                        className={cn(
                          "group relative h-1.5 rounded-full transition-all duration-300 overflow-hidden",
                          index === currentSlide ? "w-12 bg-white/40" : "w-6 bg-white/20 hover:bg-white/30"
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
            )}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-2 opacity-60">
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
