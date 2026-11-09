'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  minDurationMs?: number;
}

export default function SplashScreen({
  onComplete,
  minDurationMs = 2100,
}: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const [statusMessage, setStatusMessage] = useState('PREPARING YOUR LEARNING EXPERIENCE');

  // Generate subtle golden stardust particle coordinates
  const particles = useMemo(() => {
    return Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      top: `${(i * 17 + 13) % 94}%`,
      left: `${(i * 23 + 7) % 96}%`,
      size: `${1.5 + ((i % 4) * 0.7)}px`,
      delay: `${(i * 0.23).toFixed(2)}s`,
      duration: `${3.5 + ((i % 3) * 1.2)}s`,
      opacity: 0.2 + ((i % 5) * 0.12),
    }));
  }, []);

  // Symmetrical horizontal-diagonal line configurations
  const horizontalLines = useMemo(() => {
    return [
      { yOffset: -55, angle: -5, length: '180px', smLength: '260px', opacity: 0.85, delay: '0.15s', thickness: 1.5 },
      { yOffset: -33, angle: -4, length: '210px', smLength: '310px', opacity: 0.65, delay: '0.22s', thickness: 1.0 },
      { yOffset: -11, angle: -6, length: '240px', smLength: '360px', opacity: 0.90, delay: '0.30s', thickness: 1.5 },
      { yOffset: 11, angle: -5, length: '230px', smLength: '340px', opacity: 0.75, delay: '0.38s', thickness: 1.0 },
      { yOffset: 33, angle: -4, length: '200px', smLength: '290px', opacity: 0.60, delay: '0.45s', thickness: 1.2 },
      { yOffset: 55, angle: -6, length: '170px', smLength: '240px', opacity: 0.45, delay: '0.52s', thickness: 1.0 },
    ];
  }, []);

  useEffect(() => {
    const hasSeen = typeof window !== 'undefined' && sessionStorage.getItem('msi_splash_viewed');
    const targetDuration = hasSeen ? 1200 : minDurationMs;
    const startTime = performance.now();
    let animationFrameId: number;

    const milestones = [
      { at: 18, text: 'PREPARING YOUR LEARNING EXPERIENCE' },
      { at: 42, text: 'INDEXING CONSTITUTIONAL PRECEDENTS...' },
      { at: 70, text: 'CALIBRATING PCS-J & CLAT MODULES...' },
      { at: 90, text: 'CRAFTING LEGAL BRILLIANCE...' },
      { at: 100, text: 'WELCOME TO MSI GROUP OF INSTITUTES' },
    ];

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const raw = Math.min((elapsed / targetDuration) * 100, 100);
      const currentInt = Math.floor(raw);

      setProgress(currentInt);

      const found = milestones.find((m) => currentInt <= m.at) || milestones[milestones.length - 1];
      setStatusMessage(found.text);

      if (raw < 100) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('msi_splash_viewed', 'true');
        }
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            setShouldRender(false);
            if (onComplete) onComplete();
          }, 700);
        }, 220);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [minDurationMs, onComplete]);

  // Fast skip trigger
  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('msi_splash_viewed', 'true');
    }
    setProgress(100);
    setStatusMessage('WELCOME TO MSI GROUP OF INSTITUTES');
    setIsExiting(true);
    setTimeout(() => {
      setShouldRender(false);
      if (onComplete) onComplete();
    }, 350);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[99999999] select-none flex flex-col items-center justify-between overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
        isExiting ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 45%, #651C2C 0%, #4A101D 35%, #300B15 72%, #1A050B 100%)',
        color: '#FDFBF7',
      }}
      aria-label="MSI Group of Institutes Splash Screen"
      role="dialog"
      aria-modal="true"
    >
      {/* ── Background Subtle Watermark Crest ────────────────── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] sm:w-[680px] sm:h-[680px] opacity-[0.035] pointer-events-none select-none filter blur-[0.5px]">
        <Image
          src="/images/msi-official-logo.png"
          alt=""
          fill
          priority
          sizes="680px"
          className="object-contain"
        />
      </div>

      {/* ── Ambient Radial Golden Lighting Core ──────────────── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] sm:w-[600px] sm:h-[600px] bg-[#C8A45D]/12 rounded-full blur-[140px] pointer-events-none animate-aura-pulse" />

      {/* ── Soft Deep Crimson Vignette Flares ───────────────── */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#651C2C]/30 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-[#4A101D]/40 rounded-full blur-[160px] pointer-events-none" />

      {/* ── Understated Golden Stardust Particles ────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-[#E7D19A]"
            style={{
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              boxShadow: '0 0 6px rgba(231, 209, 154, 0.6)',
              animation: `goldDustFloat ${p.duration} ease-in-out infinite`,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>

      {/* ── Top Subtle Gold Horizon Border ──────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C8A45D]/80 to-transparent opacity-90" />

      {/* ══════════════════════════════════════════════════════ */}
      {/* 1. TOP HEADER HUD                                     */}
      {/* ══════════════════════════════════════════════════════ */}
      <header className="relative z-20 w-full max-w-[1400px] px-6 sm:px-12 pt-6 sm:pt-9 flex items-center justify-between text-xs font-mono tracking-widest text-[#E7D19A]">
        <div className="flex items-center space-x-2.5">
          <span className="w-2 h-2 rounded-full bg-[#C8A45D] animate-ping" />
          <span className="text-[#FDFBF7]/90 uppercase font-bold text-[10px] sm:text-xs tracking-widest">
            MSI // ACADEMIC & JUDICIAL EXCELLENCE
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          className="group flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-[#651C2C] text-[#FDFBF7] border border-[#C8A45D]/30 hover:border-[#C8A45D] transition-all duration-300 text-[11px] font-bold tracking-wider cursor-pointer shadow-xs"
        >
          <span>SKIP INTRO</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1 text-[#C8A45D]" />
        </button>
      </header>

      {/* ══════════════════════════════════════════════════════ */}
      {/* 2. CENTER HERO: HORIZONTAL DIAGONAL LINES + MSI LOGO  */}
      {/* ══════════════════════════════════════════════════════ */}
      <main className="relative z-20 flex flex-col items-center justify-center text-center my-auto px-6 w-full max-w-5xl">
        
        {/* Crest & Architectural Line Container */}
        <div className="relative w-full max-w-2xl flex items-center justify-center my-2 sm:my-4">
          
          {/* ── LEFT WING: Symmetrical Horizontal-Diagonal Lines ── */}
          <div className="absolute right-1/2 mr-28 sm:mr-36 lg:mr-42 top-1/2 -translate-y-1/2 pointer-events-none hidden xs:block">
            {horizontalLines.map((line, idx) => (
              <div
                key={`left-line-${idx}`}
                className="relative flex items-center justify-end"
                style={{
                  height: `${line.thickness}px`,
                  marginTop: idx === 0 ? 0 : '14px',
                  transform: `rotate(${line.angle}deg)`,
                }}
              >
                {/* Outward Expanding Horizontal Line (Center -> Left) */}
                <div
                  className="origin-right"
                  style={{
                    width: line.smLength,
                    height: `${line.thickness}px`,
                    background: 'linear-gradient(to left, rgba(200, 164, 93, 0.95), rgba(231, 209, 154, 0.55), rgba(200, 164, 93, 0.15), transparent)',
                    opacity: line.opacity,
                    boxShadow: '0 0 8px rgba(200, 164, 93, 0.3)',
                    animation: 'horizontalLineReveal 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    animationDelay: line.delay,
                  }}
                />
                {/* Gold Diamond Anchor Node */}
                <span
                  className="w-1.5 h-1.5 rotate-45 bg-[#E7D19A] shrink-0 ml-1.5"
                  style={{
                    boxShadow: '0 0 6px #C8A45D',
                    opacity: line.opacity,
                  }}
                />
              </div>
            ))}
          </div>

          {/* ── RIGHT WING: Symmetrical Horizontal-Diagonal Lines ── */}
          <div className="absolute left-1/2 ml-28 sm:ml-36 lg:ml-42 top-1/2 -translate-y-1/2 pointer-events-none hidden xs:block">
            {horizontalLines.map((line, idx) => (
              <div
                key={`right-line-${idx}`}
                className="relative flex items-center justify-start"
                style={{
                  height: `${line.thickness}px`,
                  marginTop: idx === 0 ? 0 : '14px',
                  transform: `rotate(${-line.angle}deg)`,
                }}
              >
                {/* Gold Diamond Anchor Node */}
                <span
                  className="w-1.5 h-1.5 rotate-45 bg-[#E7D19A] shrink-0 mr-1.5"
                  style={{
                    boxShadow: '0 0 6px #C8A45D',
                    opacity: line.opacity,
                  }}
                />
                {/* Outward Expanding Horizontal Line (Center -> Right) */}
                <div
                  className="origin-left"
                  style={{
                    width: line.smLength,
                    height: `${line.thickness}px`,
                    background: 'linear-gradient(to right, rgba(200, 164, 93, 0.95), rgba(231, 209, 154, 0.55), rgba(200, 164, 93, 0.15), transparent)',
                    opacity: line.opacity,
                    boxShadow: '0 0 8px rgba(200, 164, 93, 0.3)',
                    animation: 'horizontalLineReveal 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    animationDelay: line.delay,
                  }}
                />
              </div>
            ))}
          </div>

          {/* ── CENTER: CONCENTRIC ORBITAL RINGS & ORIGINAL MSI CREST ── */}
          <div className="relative w-48 h-48 sm:w-60 sm:h-60 lg:w-68 lg:h-68 flex items-center justify-center shrink-0">
            
            {/* Soft Pulsing Shockwave Aura */}
            <div className="absolute inset-0 rounded-full border border-[#C8A45D]/30 animate-aura-pulse pointer-events-none" />

            {/* Outer Dashed Celestial Astrolabe Ring (Rotating Clockwise) */}
            <div className="absolute -inset-3 sm:-inset-4 rounded-full border-2 border-dashed border-[#C8A45D]/45 animate-astrolabe pointer-events-none" />

            {/* Fine Rich Crimson / Burgundy Inner Orbit (Counter-Rotating) */}
            <div className="absolute inset-1.5 rounded-full border border-[#882018]/90 animate-astrolabe-reverse pointer-events-none" />

            {/* Cardinal Diamond Jewel Points (12, 3, 6, 9 o'clock) */}
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#E7D19A] shadow-[0_0_10px_#C8A45D]" />
            <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#E7D19A] shadow-[0_0_10px_#C8A45D]" />
            <span className="absolute top-1/2 -left-3.5 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#C8A45D] shadow-[0_0_10px_#C8A45D]" />
            <span className="absolute top-1/2 -right-3.5 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#C8A45D] shadow-[0_0_10px_#C8A45D]" />

            {/* Orbiting Satellite Star */}
            <div
              className="absolute -inset-3.5 sm:-inset-4 rounded-full animate-spin pointer-events-none"
              style={{ animationDuration: '8s' }}
            >
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-[#E7D19A] shadow-[0_0_14px_#E7D19A] animate-pulse" />
              </div>
            </div>

            {/* Central Seal Housing with Metallic Antique Gold Bezel */}
            <div className="relative w-36 h-36 sm:w-48 sm:h-48 lg:w-54 lg:h-54 rounded-full p-1.5 bg-gradient-to-br from-[#E7D19A] via-[#C8A45D] to-[#4A101D] shadow-[0_0_45px_rgba(200,164,93,0.4),0_15px_35px_rgba(0,0,0,0.85)] animate-logo-float transition-transform duration-500 hover:scale-105">
              
              {/* Inner Burgundy Core */}
              <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-[#4A101D] to-[#300B15] border-2 border-[#C8A45D]">
                
                {/* Original Official MSI Logo */}
                <Image
                  src="/images/msi-official-logo.png"
                  alt="MSI Group of Institutes Official Logo"
                  fill
                  priority
                  className="object-contain p-1 filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.7)]"
                  sizes="(max-width: 640px) 144px, 192px"
                />

                {/* Specular Diagonal Light Sweep (Simulating luxury gold metallic reflection) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                  <div className="w-[180%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-25 animate-sheen-sweep" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Eyebrow Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#C8A45D]/15 border border-[#C8A45D]/40 mb-2.5 backdrop-blur-md shadow-xs">
          <Sparkles className="w-3 h-3 text-[#E7D19A]" />
          <span className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] text-[#E7D19A] uppercase">
            KHARAR, MOHALI • ESTD. 2018
          </span>
        </div>

        {/* Grand Typography Headline */}
        <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#C8A45D] via-[#FDFBF7] to-[#E7D19A] tracking-tight leading-none mb-2 drop-shadow-[0_4px_24px_rgba(200,164,93,0.3)]">
          MSI GROUP OF INSTITUTES
        </h1>

        {/* Subtitle Legal Motto */}
        <p className="font-serif italic text-xs sm:text-sm text-[#E7D19A]/90 font-medium tracking-wide mb-6">
          Crafting Legal Brilliance, Creating a Better Nation
        </p>

        {/* ══════════════════════════════════════════════════════ */}
        {/* 3. LAW-INSPIRED GAVEL LOADING ANIMATION & PROGRESS BAR */}
        {/* ══════════════════════════════════════════════════════ */}
        <div className="w-full max-w-[320px] sm:max-w-[420px] flex flex-col items-center">
          
          {/* Animated Golden Law Gavel + Sound Block + Strike Ripple */}
          <div className="relative w-28 h-16 flex items-center justify-center mb-1">
            <svg
              viewBox="0 0 100 60"
              className="w-full h-full overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Antique Gold Metallic Gradients */}
                <linearGradient id="goldHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E7D19A" />
                  <stop offset="50%" stopColor="#C8A45D" />
                  <stop offset="100%" stopColor="#8A6B2D" />
                </linearGradient>

                <linearGradient id="goldHandleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#C8A45D" />
                  <stop offset="40%" stopColor="#E7D19A" />
                  <stop offset="70%" stopColor="#8A6B2D" />
                  <stop offset="100%" stopColor="#5E4316" />
                </linearGradient>

                <linearGradient id="soundBlockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E7D19A" />
                  <stop offset="45%" stopColor="#C8A45D" />
                  <stop offset="100%" stopColor="#4A101D" />
                </linearGradient>

                <radialGradient id="strikeGlowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#E7D19A" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#C8A45D" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#651C2C" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Sound Block (Pedestal where gavel strikes) */}
              <g id="soundBlock" transform="translate(56, 42)">
                {/* Circular Strike Ripple Wave */}
                <circle
                  cx="14"
                  cy="5"
                  r="12"
                  fill="url(#strikeGlowGrad)"
                  className="animate-gavel-ripple"
                />
                {/* Sound block base */}
                <ellipse cx="14" cy="7" rx="15" ry="4" fill="#300B15" opacity="0.6" />
                <rect x="0" y="3" width="28" height="5" rx="2.5" fill="url(#soundBlockGrad)" stroke="#E7D19A" strokeWidth="0.5" />
                <ellipse cx="14" cy="3" rx="14" ry="2.5" fill="#E7D19A" opacity="0.8" />
              </g>

              {/* Gavel Assembly (Hammer + Handle with Strike Rotation) */}
              <g id="gavelAssembly" className="animate-gavel-strike" style={{ transformOrigin: '28px 46px' }}>
                {/* Polished Gavel Handle */}
                <path
                  d="M26 44 L58 20"
                  stroke="url(#goldHandleGrad)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                {/* Handle Pommel End Cap */}
                <circle cx="26" cy="44" r="2.8" fill="url(#goldHeadGrad)" stroke="#4A101D" strokeWidth="0.6" />
                {/* Decorative Handle Ring */}
                <circle cx="48" cy="27.5" r="2.2" fill="#E7D19A" />

                {/* Gavel Head (Cylindrical Mallet with Gold & Maroon Accents) */}
                <g transform="translate(58, 20) rotate(-37)">
                  {/* Outer Main Mallet Body */}
                  <rect x="-6" y="-12" width="12" height="24" rx="2.5" fill="url(#goldHeadGrad)" stroke="#FDFBF7" strokeWidth="0.5" />
                  {/* Central Maroon Inlay Band */}
                  <rect x="-6" y="-3.5" width="12" height="7" fill="#651C2C" />
                  {/* Center Gold Accent Ring */}
                  <line x1="-6" y1="0" x2="6" y2="0" stroke="#E7D19A" strokeWidth="0.8" />
                  {/* Top Beveled Striking Face */}
                  <ellipse cx="0" cy="-12" rx="6" ry="2" fill="#E7D19A" />
                  {/* Bottom Striking Face */}
                  <ellipse cx="0" cy="12" rx="6" ry="2" fill="#8A6B2D" />
                </g>
              </g>
            </svg>
          </div>

          {/* Dynamic Percentage Counter */}
          <div className="flex items-baseline justify-center space-x-1 mb-1.5">
            <span className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-[#FDFBF7] drop-shadow-[0_2px_12px_rgba(200,164,93,0.4)] tabular-nums">
              {String(progress).padStart(2, '0')}
            </span>
            <span className="font-serif text-lg sm:text-xl text-[#C8A45D] font-bold">
              %
            </span>
          </div>

          {/* Cycling Institutional Status Label */}
          <div className="h-4 flex items-center justify-center mb-2.5">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.2em] text-[#E7D19A] uppercase transition-all duration-300">
              {statusMessage}
            </span>
          </div>

          {/* Luxury Horizontal Progress Track with Illuminated Head */}
          <div className="relative w-full h-[3px] bg-black/40 border border-[#C8A45D]/25 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#651C2C] via-[#C8A45D] to-[#E7D19A] rounded-full transition-all duration-100 ease-out shadow-[0_0_12px_#C8A45D]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Bottom HUD Metadata */}
          <div className="w-full flex items-center justify-between text-[9px] font-mono text-[#E7D19A]/60 mt-2 tracking-wider">
            <span>PCS-J · CLAT · PU LAW</span>
            <span>300+ SELECTIONS</span>
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════ */}
      {/* 4. FOOTER CREDITS & HINT                              */}
      {/* ══════════════════════════════════════════════════════ */}
      <footer className="relative z-20 w-full max-w-[1400px] px-6 sm:px-12 pb-6 sm:pb-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
        <p className="text-[10px] sm:text-[11px] text-[#FDFBF7]/50 tracking-wider">
          Premier Legal Coaching Destination in Kharar, Mohali, Punjab
        </p>

        <div className="text-[10px] font-mono text-[#E7D19A]/60 uppercase tracking-widest flex items-center space-x-1.5 hover:text-[#E7D19A] transition-colors cursor-pointer">
          <span>Click anywhere to enter</span>
          <span className="text-[#C8A45D]">→</span>
        </div>
      </footer>

      {/* Bottom Glowing Accent Beam */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C8A45D]/80 to-transparent opacity-90" />
    </div>
  );
}
