'use client';

import React from 'react';
import {
  GraduationCap,
  Users,
  TrendingUp,
  ShieldCheck,
  Lightbulb,
} from 'lucide-react';
import { FEATURE_ITEMS } from '@/lib/constants';

export default function FeatureStrip() {
  const renderIcon = (iconName: string) => {
    const iconClass = 'w-6 h-6 text-[#89190E] transition-transform duration-300 group-hover:scale-110';
    switch (iconName) {
      case 'graduation-cap':
        return <GraduationCap className={iconClass} strokeWidth={2.2} />;
      case 'users':
        return <Users className={iconClass} strokeWidth={2.2} />;
      case 'trending-up':
        return <TrendingUp className={iconClass} strokeWidth={2.2} />;
      case 'shield-star':
        return <ShieldCheck className={iconClass} strokeWidth={2.2} />;
      case 'lightbulb':
        return <Lightbulb className={iconClass} strokeWidth={2.2} />;
      default:
        return <GraduationCap className={iconClass} />;
    }
  };

  return (
    <section className="relative z-30 w-full max-w-[1380px] mx-auto px-4 sm:px-6 -mt-14 sm:-mt-16 mb-8 select-none">
      <div className="w-[96%] sm:w-[94%] mx-auto glass-feature-strip rounded-[28px] sm:rounded-[36px] py-6 sm:py-7 px-4 sm:px-6 lg:px-8 border border-white/95 shadow-xl transition-all duration-300">
        {/* Desktop: flex row with dividers */}
        <div className="hidden md:flex items-center justify-between">
          {FEATURE_ITEMS.map((item, index) => (
            <React.Fragment key={item.id}>
              <div
                className="flex items-center space-x-3.5 px-3 lg:px-5 group flex-1 justify-center cursor-default transition-all duration-300 hover:-translate-y-0.5"
                title={item.description}
              >
                {/* Circular Icon Wrapper */}
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-[#FFF3DD] border border-[#F7E5BF] flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-[#89190E] group-hover:border-[#89190E] group-hover:rotate-3 shadow-xs">
                  <div className="group-hover:text-white [&>svg]:group-hover:text-white transition-colors duration-300">
                    {renderIcon(item.iconName)}
                  </div>
                </div>

                {/* Feature Label */}
                <div className="flex flex-col">
                  {item.title.split('\n').map((line, lIdx) => (
                    <span
                      key={lIdx}
                      className="text-[#10233F] text-[15px] lg:text-[16px] font-bold leading-[1.2] group-hover:text-[#89190E] transition-colors"
                    >
                      {line}
                    </span>
                  ))}
                </div>
              </div>

              {/* Vertical hairline divider between items */}
              {index < FEATURE_ITEMS.length - 1 && (
                <div className="w-[1px] h-10 bg-[#E8DCCB]/80 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile: 1-col on small phones, 2-col on larger mobile */}
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {FEATURE_ITEMS.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center space-x-3 p-2.5 rounded-2xl bg-white/70 border border-[#E8DCCB]/70 group ${
                index === FEATURE_ITEMS.length - 1 ? 'sm:col-span-2 sm:max-w-xs sm:mx-auto w-full' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFF3DD] border border-[#F7E5BF] flex items-center justify-center flex-shrink-0">
                {renderIcon(item.iconName)}
              </div>
              <div className="flex flex-col min-w-0">
                {item.title.split('\n').map((line, lIdx) => (
                  <span
                    key={lIdx}
                    className="text-[#10233F] text-[13px] sm:text-[14px] font-bold leading-[1.2] truncate"
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
