import React from 'react';
import Image from 'next/image';
import { STUDENT_AVATARS } from '@/lib/constants';

export default function TrustIndicator() {
  return (
    <div className="flex items-center space-x-3.5 pt-2 select-none">
      {/* 5 Overlapping Indian Student Avatars */}
      <div className="flex items-center -space-x-2.5 flex-shrink-0">
        {STUDENT_AVATARS.map((avatar, idx) => (
          <div
            key={avatar.id}
            className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-white shadow-sm overflow-hidden bg-[#FFF3DD] transition-transform hover:scale-110 hover:z-10"
            style={{ zIndex: 10 - idx }}
          >
            <Image
              src={avatar.src}
              alt={avatar.alt}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Trust Text */}
      <div className="flex flex-col justify-center">
        <span className="text-[#10233F] text-[14px] sm:text-[15px] font-bold tracking-tight leading-snug">
          16K+ Students Trust Us
        </span>
        <span className="text-[#526174] text-[12px] sm:text-[13px] font-normal leading-snug">
          Join a community of dreamers and achievers.
        </span>
      </div>
    </div>
  );
}
