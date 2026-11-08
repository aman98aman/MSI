'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/navbar/Navbar';
import EnquiryModal from '@/components/modals/EnquiryModal';
import { Home, ArrowRight, BookOpen, GraduationCap, Phone } from 'lucide-react';

const quickLinks = [
  { label: 'Academic Programs', href: '/courses', icon: GraduationCap },
  { label: 'About MSI', href: '/about', icon: BookOpen },
  { label: 'Contact Admissions', href: '/contact', icon: Phone },
];

export default function NotFound() {
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFF9EF] text-[#10233F] flex flex-col selection:bg-[#EFC988] selection:text-[#89190E]">
      <Navbar onOpenEnquiry={() => setIsEnquiryOpen(true)} />

      <main className="flex-grow flex items-center justify-center px-6 py-24">
        <div className="text-center max-w-2xl mx-auto">
          {/* Large 404 display */}
          <div className="relative mb-10">
            <div
              className="font-serif text-[160px] sm:text-[200px] font-extrabold leading-none select-none"
              style={{
                background: 'linear-gradient(135deg, #89190E 0%, #EFC988 50%, #89190E 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                opacity: 0.15,
              }}
            >
              404
            </div>
            {/* Centered overlay content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-3xl bg-[#FFF3DD] border border-[#E8DCCB] flex items-center justify-center mb-5 shadow-sm">
                <span className="text-3xl">🎓</span>
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#89190E] block mb-2">
                Page Not Found
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#10233F] mb-4">
            This Page Has Graduated
          </h1>
          <p className="text-[#526174] text-base sm:text-lg leading-relaxed mb-10 max-w-lg mx-auto">
            The page you&apos;re looking for may have been moved, renamed, or may no longer exist. Let us guide you back to the right destination.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="/"
              className="h-12 px-8 rounded-xl bg-[#89190E] hover:bg-[#65130D] text-white font-bold text-sm flex items-center space-x-2 transition-all shadow-md shadow-[#89190E]/20"
            >
              <Home className="w-4 h-4" />
              <span>Back to Homepage</span>
            </Link>
            <button
              onClick={() => setIsEnquiryOpen(true)}
              className="h-12 px-8 rounded-xl bg-white border border-[#E8DCCB] hover:border-[#89190E] text-[#10233F] font-bold text-sm flex items-center space-x-2 transition-all"
            >
              <span>Contact Admissions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group bg-white border border-[#E8DCCB] rounded-2xl p-5 hover:shadow-lg hover:border-[#EFC988] transition-all hover:-translate-y-1 flex items-center space-x-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FFF3DD] text-[#89190E] flex items-center justify-center flex-shrink-0 group-hover:bg-[#89190E] group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-sm text-[#10233F] group-hover:text-[#89190E] transition-colors text-left">
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />
    </div>
  );
}
