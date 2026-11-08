'use client';

import React, { useEffect, useRef } from 'react';

type HoverType = 'none' | 'card' | 'interactive';

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Persistent coordinate and state refs — avoids React re-renders during motion
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const isInitialized = useRef(false);
  const isVisible = useRef(false);
  const isClicked = useRef(false);
  const hoverType = useRef<HoverType>('none');

  useEffect(() => {
    // Only run on desktop devices with fine pointer
    if (typeof window === 'undefined') return;

    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;

    if (isTouch) return;

    // Direct DOM styling helper to prevent layout thrashing
    const updateRingAppearance = () => {
      if (!ringRef.current || !dotRef.current) return;

      const ring = ringRef.current;
      const dot = dotRef.current;

      if (isClicked.current) {
        ring.style.width = '28px';
        ring.style.height = '28px';
        ring.style.borderColor = '#89190E';
        ring.style.backgroundColor = 'rgba(137, 25, 14, 0.25)';
        ring.style.boxShadow = '0 0 18px rgba(137, 25, 14, 0.6)';
        dot.style.transform = 'translate3d(0, 0, 0) translate(-50%, -50%) scale(0.7)';
      } else if (hoverType.current === 'card') {
        // Expanded luxury gold halo on cards — stays locked with cursor anywhere inside card
        ring.style.width = '48px';
        ring.style.height = '48px';
        ring.style.borderColor = '#EFC988';
        ring.style.backgroundColor = 'rgba(239, 201, 136, 0.12)';
        ring.style.boxShadow = '0 0 20px rgba(239, 201, 136, 0.45), inset 0 0 10px rgba(239, 201, 136, 0.15)';
        dot.style.transform = 'translate3d(0, 0, 0) translate(-50%, -50%) scale(1.15)';
      } else if (hoverType.current === 'interactive') {
        // Focused crimson ring on buttons, links, tabs
        ring.style.width = '40px';
        ring.style.height = '40px';
        ring.style.borderColor = '#89190E';
        ring.style.backgroundColor = 'rgba(137, 25, 14, 0.14)';
        ring.style.boxShadow = '0 0 16px rgba(137, 25, 14, 0.5)';
        dot.style.transform = 'translate3d(0, 0, 0) translate(-50%, -50%) scale(1.2)';
      } else {
        // Default refined dual-tone ring
        ring.style.width = '32px';
        ring.style.height = '32px';
        ring.style.borderColor = 'rgba(16, 35, 63, 0.55)';
        ring.style.backgroundColor = 'rgba(239, 201, 136, 0.05)';
        ring.style.boxShadow = '0 0 8px rgba(16, 35, 63, 0.15)';
        dot.style.transform = 'translate3d(0, 0, 0) translate(-50%, -50%) scale(1)';
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      mousePos.current.x = clientX;
      mousePos.current.y = clientY;

      // On very first movement, snap ring instantly to mouse position (no fly-in lag)
      if (!isInitialized.current) {
        ringPos.current.x = clientX;
        ringPos.current.y = clientY;
        isInitialized.current = true;
      }

      if (!isVisible.current) {
        isVisible.current = true;
        if (containerRef.current) {
          containerRef.current.style.opacity = '1';
        }
      }

      // Move center dot synchronously with 0 lag
      if (dotRef.current) {
        dotRef.current.style.left = `${clientX}px`;
        dotRef.current.style.top = `${clientY}px`;
      }

      // Detect hover target
      const target = e.target as HTMLElement | null;
      if (target) {
        const isCard = Boolean(target.closest('.blueprint-card, [data-card]'));
        const isInteractive = Boolean(
          target.closest('a, button, input, select, textarea, [role="button"], label, .cursor-pointer, .interactive-cursor')
        );

        let nextType: HoverType = 'none';
        if (isInteractive && !isCard) {
          nextType = 'interactive';
        } else if (isCard) {
          nextType = 'card';
        }

        if (hoverType.current !== nextType) {
          hoverType.current = nextType;
          updateRingAppearance();
        }
      }
    };

    const onMouseDown = () => {
      isClicked.current = true;
      updateRingAppearance();
    };

    const onMouseUp = () => {
      isClicked.current = false;
      updateRingAppearance();
    };

    const onMouseEnter = () => {
      isVisible.current = true;
      if (containerRef.current) containerRef.current.style.opacity = '1';
    };

    const onMouseLeave = () => {
      isVisible.current = false;
      if (containerRef.current) containerRef.current.style.opacity = '0';
    };

    const onScroll = () => {
      // Re-anchor coordinates on scroll if element under cursor changes
      if (dotRef.current && isVisible.current) {
        dotRef.current.style.left = `${mousePos.current.x}px`;
        dotRef.current.style.top = `${mousePos.current.y}px`;
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.documentElement.addEventListener('mouseenter', onMouseEnter);
    document.documentElement.addEventListener('mouseleave', onMouseLeave);

    // High performance RAF loop for silky-smooth trailing circle
    let rafId: number;
    const lerpFactor = 0.32; // Snappy yet fluid trailing response

    const loop = () => {
      if (isVisible.current && ringRef.current) {
        const dx = mousePos.current.x - ringPos.current.x;
        const dy = mousePos.current.y - ringPos.current.y;

        ringPos.current.x += dx * lerpFactor;
        ringPos.current.y += dy * lerpFactor;

        ringRef.current.style.left = `${ringPos.current.x}px`;
        ringRef.current.style.top = `${ringPos.current.y}px`;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('scroll', onScroll);
      document.documentElement.removeEventListener('mouseenter', onMouseEnter);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-[999999] select-none opacity-0 transition-opacity duration-300 overflow-hidden"
      aria-hidden="true"
    >
      {/* Outer Smooth Trailing Ring */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed rounded-full will-change-transform -translate-x-1/2 -translate-y-1/2 border transition-[width,height,border-color,background-color,box-shadow] duration-200 ease-out"
        style={{
          width: '32px',
          height: '32px',
          borderColor: 'rgba(16, 35, 63, 0.55)',
          backgroundColor: 'rgba(239, 201, 136, 0.05)',
          boxShadow: '0 0 8px rgba(16, 35, 63, 0.15)',
          left: '-100px',
          top: '-100px',
        }}
      />

      {/* Synchronous Precision Center Dot */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed rounded-full will-change-transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 ease-out"
        style={{
          width: '6px',
          height: '6px',
          backgroundColor: '#89190E',
          border: '1px solid #FFF9EF',
          boxShadow: '0 0 6px rgba(137, 25, 14, 0.8)',
          left: '-100px',
          top: '-100px',
        }}
      />
    </div>
  );
}
