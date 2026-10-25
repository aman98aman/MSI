import React from 'react';

interface CurvedUnderlineProps {
  className?: string;
}

export default function CurvedUnderline({ className = '' }: CurvedUnderlineProps) {
  return (
    <div className={`relative w-full overflow-visible pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 450 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto overflow-visible"
        preserveAspectRatio="none"
      >
        {/* Hand-drawn organic curved underline stroke */}
        <path
          d="M 6 18 C 85 8, 175 6, 260 9 C 340 12, 405 16, 442 12 C 445 11.7, 442 16, 432 17.5 C 365 24, 250 23, 155 20 C 85 18, 25 21, 8 20 C 5 19.8, 4 18.2, 6 18 Z"
          fill="#EFC988"
        />
        {/* Subtle secondary textured stroke for natural hand-drawn depth */}
        <path
          d="M 22 17 C 120 11, 230 11, 380 15 C 410 16, 435 15, 420 17 C 320 20.5, 180 18.5, 45 19 C 28 19, 20 18, 22 17 Z"
          fill="#F7E5BF"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}
