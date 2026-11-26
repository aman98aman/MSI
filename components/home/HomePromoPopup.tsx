'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { X, Sparkles, ArrowRight, ExternalLink, MapPin, Monitor } from 'lucide-react';

interface PopupConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  badgeText: string;
  badgeColor: string;
  scrollingTexts: string[];
  onlineLink: string;
  offlineLink: string;
  onlineLinkText: string;
  offlineLinkText: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  showOnce: boolean;
  delaySeconds: number;
  imageUrl?: string;
}

const DEFAULT_CONFIG: PopupConfig = {
  enabled: true,
  title: 'Register for Free Mock Test',
  subtitle: 'MSI Group of Institutes — Official Mock Test Series 2027',
  description:
    'Attempt Full-Length Mock Tests for CLAT, PCS-J (Judiciary) & AILET. Instant Scorecard, Ranking & PDF Download.',
  badgeText: 'FREE REGISTRATION',
  badgeColor: '#EFC988',
  scrollingTexts: [
    '🏛️ CLAT 2027 Free Mock Test — Register Now!',
    '⚖️ PCS-J (Judiciary) Mock Series — Online & Offline',
    '📋 AILET & Law Entrance Mock Tests Available',
    '🎯 All-India Ranking with Instant Scorecard',
    '📄 Free PDF Download with Answer Key',
  ],
  onlineLink: '/exam',
  offlineLink: '/contact',
  onlineLinkText: 'Register Online',
  offlineLinkText: 'Register Offline / Walk-In',
  ctaButtonText: 'Register for Free Mock Test',
  ctaButtonLink: '/exam',
  showOnce: false,
  delaySeconds: 3,
};

const STORAGE_KEY = 'msi_promo_popup_dismissed_v2';

export default function HomePromoPopup() {
  const [config, setConfig] = useState<PopupConfig>(DEFAULT_CONFIG);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);
  const rafRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── Load config from API ── */
  useEffect(() => {
    setIsMounted(true);
    fetch('/api/home-popup')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setConfig({ ...DEFAULT_CONFIG, ...data });
      })
      .catch(() => {/* use defaults */});
  }, []);

  /* ── Show popup after delay ── */
  useEffect(() => {
    if (!isMounted) return;
    if (!config.enabled) return;

    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (config.showOnce && dismissed) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, (config.delaySeconds || 3) * 1000);

    return () => clearTimeout(timer);
  }, [isMounted, config]);

  /* ── Smooth scrolling marquee for text ── */
  useEffect(() => {
    if (!isVisible) return;
    let pos = 0;
    const speed = 0.5;
    const animate = () => {
      pos += speed;
      if (scrollRef.current) {
        const half = scrollRef.current.scrollWidth / 2;
        if (pos >= half) pos = 0;
        scrollRef.current.style.transform = `translateX(-${pos}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    if (config.showOnce) {
      sessionStorage.setItem(STORAGE_KEY, '1');
    }
  };

  if (!isMounted || !isVisible) return null;

  const repeatedTexts = [...config.scrollingTexts, ...config.scrollingTexts];

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-[9000] bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Close popup"
      />

      {/* ── Popup Card ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Register for Free Mock Test"
        className="fixed z-[9001] inset-0 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl animate-popup-in"
          style={{
            background: 'linear-gradient(145deg, #0A1628 0%, #10233F 50%, #1a0f0a 100%)',
            border: '1px solid rgba(239,201,136,0.35)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(239,201,136,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* ── Top Image / Banner Area ── */}
          <div
            className="relative w-full"
            style={{
              background: 'linear-gradient(135deg, #89190E 0%, #c0392b 40%, #EFC988 100%)',
              minHeight: '130px',
            }}
          >
            {/* MSI Logo badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/msi-crest.png" alt="MSI" className="w-7 h-7 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <span className="text-white text-xs font-bold uppercase tracking-widest opacity-90">MSI Group</span>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all z-10 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Badge */}
            <div className="flex justify-center pt-10 pb-2">
              <div
                className="animate-badge-pulse px-4 py-1.5 rounded-full text-[#10233F] text-sm font-black uppercase tracking-widest"
                style={{ background: config.badgeColor || '#EFC988', boxShadow: '0 4px 20px rgba(239,201,136,0.5)' }}
              >
                <Sparkles className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                {config.badgeText}
              </div>
            </div>

            {/* Title */}
            <div className="text-center px-6 pb-4">
              <h2 className="text-white text-xl sm:text-2xl font-black leading-tight drop-shadow">
                {config.title}
              </h2>
            </div>
          </div>

          {/* ── Scrolling Text Marquee Bar ── */}
          <div
            className="relative overflow-hidden py-2.5"
            style={{ background: 'linear-gradient(90deg, #89190E, #c0392b, #89190E)' }}
          >
            <div
              ref={scrollRef}
              className="flex items-center gap-8 whitespace-nowrap"
              style={{ willChange: 'transform' }}
            >
              {repeatedTexts.map((text, idx) => (
                <span
                  key={idx}
                  className="text-white text-[11px] sm:text-xs font-semibold tracking-wide shrink-0"
                >
                  {text}
                  <span className="mx-4 opacity-50">✦</span>
                </span>
              ))}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="px-6 pt-5 pb-2">
            <p className="text-slate-400 text-xs sm:text-[13px] leading-relaxed text-center">
              {config.description}
            </p>
          </div>

          {/* ── Online / Offline Registration Buttons ── */}
          <div className="px-6 pt-4 pb-3 flex flex-col sm:flex-row gap-3">
            {/* Online */}
            <Link
              href={config.onlineLink || '/exam'}
              onClick={handleClose}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-[#10233F] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              style={{ background: 'linear-gradient(135deg, #EFC988, #d4a84b)', boxShadow: '0 4px 15px rgba(239,201,136,0.4)' }}
            >
              <Monitor className="w-4 h-4 shrink-0" />
              <span>{config.onlineLinkText}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Link>

            {/* Offline */}
            <Link
              href={config.offlineLink || '/contact'}
              onClick={handleClose}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white border border-white/20 bg-white/10 hover:bg-white/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{config.offlineLinkText}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" />
            </Link>
          </div>

          {/* ── Main CTA ── */}
          <div className="px-6 pb-5 pt-1">
            <Link
              href={config.ctaButtonLink || '/exam'}
              onClick={handleClose}
              className="block w-full text-center py-3.5 rounded-xl text-sm font-black text-white uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.98] shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #89190E 0%, #c0392b 100%)',
                boxShadow: '0 6px 20px rgba(137,25,14,0.5)',
                letterSpacing: '0.08em',
              }}
            >
              🎯 {config.ctaButtonText}
            </Link>
          </div>

          {/* ── Footer ── */}
          <div className="px-6 pb-4 text-center">
            <p className="text-slate-500 text-[10px]">
              {config.subtitle} &nbsp;•&nbsp; Secure & Instant Registration
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
