'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { HERO_SLIDES } from '@/lib/constants';
import HeroContent from './HeroContent';
import { Play, Pause } from 'lucide-react';

interface HeroSliderProps {
  onOpenVideo?: () => void;
  onOpenEnquiry?: () => void;
}

export default function HeroSlider({
  onOpenVideo,
  onOpenEnquiry,
}: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // 2400ms Auto-Slide Timer with Pause on Hover/Focus
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 2400);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      nextSlide();
    } else if (e.key === 'ArrowLeft') {
      prevSlide();
    }
  };

  return (
    <section
      className="relative w-full h-[840px] sm:h-[870px] lg:h-[910px] overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="MSI Institute Highlights Carousel"
      aria-roledescription="carousel"
    >
      {/* Background Slides with Smooth Crossfade & Slow Scale */}
      <div className="absolute inset-0 w-full h-full">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
                isActive
                  ? 'opacity-100 scale-100 pointer-events-auto'
                  : 'opacity-0 scale-105 pointer-events-none'
              }`}
              aria-hidden={!isActive}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                className="object-cover object-center transition-transform duration-7000 ease-out"
                sizes="100vw"
                quality={95}
              />
            </div>
          );
        })}
      </div>

      {/* Left-Side Soft Cream/White Organic Gradient Overlay */}
      <div
        className="absolute inset-0 z-10 hero-text-overlay pointer-events-none"
        aria-hidden="true"
      />

      {/* Hero Foreground Content */}
      <div className="relative z-20 w-full h-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-14 flex items-center">
        <HeroContent
          onOpenVideo={onOpenVideo}
          onExplorePrograms={onOpenEnquiry}
        />
      </div>

      {/* Slide Badge Pill in Top Right */}
      <div className="absolute top-28 sm:top-32 right-6 sm:right-12 z-20 hidden md:flex items-center space-x-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-white/60 shadow-sm animate-fadeIn">
        <span className="w-2 h-2 rounded-full bg-[#89190E] animate-pulse" />
        <span className="text-xs font-bold text-[#10233F]">
          {HERO_SLIDES[currentSlide].badge}
        </span>
      </div>

      {/* Bottom Center Slider Controls & Dots */}
      <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-3 p-2 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 shadow-lg">
        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors focus:outline-none"
          aria-label={isPaused ? 'Resume Carousel' : 'Pause Carousel'}
        >
          {isPaused ? <Play className="w-3 h-3 fill-white ml-0.5" /> : <Pause className="w-3 h-3 fill-white" />}
        </button>

        {/* Slide Indicator Dots */}
        <div className="flex items-center space-x-2" role="tablist">
          {HERO_SLIDES.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <button
                key={slide.id}
                onClick={() => goToSlide(index)}
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to slide ${index + 1}: ${slide.tagline}`}
                className={`h-2 transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#EFC988] ${
                  isActive
                    ? 'w-8 bg-[#EFC988] shadow-sm'
                    : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
