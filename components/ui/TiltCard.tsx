'use client';

import React, { useRef, useState, useCallback } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number; // 0-20, default 8
  glare?: boolean;
  shine?: boolean;
}

/**
 * Premium 3D tilt card — tracks mouse position and applies
 * perspective transform. Optional glare overlay.
 */
export default function TiltCard({
  children,
  className = '',
  intensity = 8,
  glare = true,
  shine = true,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Normalise to -1 … +1
        const normX = (x - centerX) / centerX;
        const normY = (y - centerY) / centerY;

        const rotateY = normX * intensity;
        const rotateX = -normY * intensity;

        setStyle({
          transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`,
          transition: 'transform 60ms linear',
        });

        if (glare) {
          const glareX = (x / rect.width) * 100;
          const glareY = (y / rect.height) * 100;
          setGlareStyle({
            opacity: 0.12,
            background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 70%)`,
          });
        }
      });
    },
    [intensity, glare]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)',
      transition: 'transform 400ms cubic-bezier(0.16,1,0.3,1)',
    });
    setGlareStyle({ opacity: 0, transition: 'opacity 300ms ease' });
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative will-change-transform ${className}`}
      style={{ ...style, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {/* Glare overlay */}
      {glare && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-20 overflow-hidden"
          style={glareStyle}
          aria-hidden="true"
        />
      )}

      {/* Shimmer shine sweep on hover */}
      {shine && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-10 overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              backgroundPosition: isHovered ? '0% 0%' : '-100% 0%',
              transition: 'background-position 500ms cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </div>
      )}
    </div>
  );
}
