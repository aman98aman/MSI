'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import TiltCard from '@/components/ui/TiltCard';
import Reveal from '@/components/ui/Reveal';
import {
  Award,
  ShieldCheck,
  Quote,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Sparkles,
  BookOpen,
  Briefcase,
  Check,
  Share2,
  Layers,
  Scale,
  GraduationCap,
} from 'lucide-react';

export interface LeaderData {
  id: string;
  name: string;
  role: string;
  designation: string;
  badge: string;
  office: string;
  dropCap: string;
  bioRest: string;
  image: string;
  credentials: string;
  portfolios: string[];
  tenet: string;
  milestone: string;
  objectPosition: string;
  stats: { label: string; value: string }[];
  keyHighlights: string[];
}

export const LEADERS: LeaderData[] = [
  {
    id: 'founder',
    name: 'Mr. Shamsher Gahlawat',
    role: 'Visionary Leader & Educationist',
    designation: 'Founder, MSI Group of Institutes',
    badge: 'Founder & Chairman',
    office: 'Office of the Founder & Chairman',
    dropCap: 'M',
    bioRest:
      'r. Shamsher Gahlawat is the driving force behind the MSI Group of Institutes, envisioning an ecosystem of quality education, skill development, and industry-ready professionals. With a strong foundation in Civil Engineering and experience as Chairperson of the Shoe Co-operation, Delhi, he brings technical expertise, innovation, and leadership to empower youth—bridging the gap between knowledge and application, and preparing students not just for jobs, but for meaningful careers and impactful lives.',
    image: '/images/leadership/founder-shamsher-gahlawat.png',
    credentials: 'Civil Engineering • Former Chairperson, Shoe Co-operation, Delhi',
    portfolios: ['Institutional Vision', 'Strategic Governance', 'Infrastructural Scale', 'Youth Empowerment'],
    tenet: 'Education must empower students to build purposeful lives, master ethical discipline, and contribute meaningfully to the nation.',
    milestone: 'Founding Patron • 18+ Yrs Institutional Leadership',
    objectPosition: 'object-top',
    stats: [
      { label: 'Leadership Tenure', value: '18+ Yrs' },
      { label: 'Institutional Pillars', value: '4 Wings' },
      { label: 'Students Mentored', value: '15,000+' },
    ],
    keyHighlights: [
      'Pioneered the MSI founding charter anchored in infrastructural scale and disciplined academic rigor.',
      'Extensive governance track record as former Chairperson of the Shoe Co-operation, Delhi.',
      'Devoted to creating accessible, high-yield pathways for competitive legal and judicial education.',
    ],
  },
  {
    id: 'cofounder',
    name: 'Dr. Ekta Gahlawat',
    role: 'Academic Visionary & Pedagogical Architect',
    designation: 'Co-Founder, MSI Group of Institutes',
    badge: 'Co-Founder & Academic Director',
    office: 'Directorate of Academic Affairs & Legal Studies',
    dropCap: 'D',
    bioRest:
      'r. Ekta Gahlawat is the pedagogical co-architect and academic cornerstone of the MSI Group of Institutes, pioneering an intellectually rigorous passage-based learning curriculum for competitive legal examinations. With a Ph.D. in Law and specialization in Constitutional Jurisprudence, she bridges academic profundity with strategic examination analytics—mentoring future judicial officers, legal scholars, and top law university aspirants to achieve transformative excellence.',
    image: '/images/leadership/cofounder-ekta-gahlawat.jpg',
    credentials: 'Ph.D. in Law • LL.M. (Constitutional Jurisprudence & Torts)',
    portfolios: ['Constitutional Jurisprudence', 'Passage-Based Pedagogy', 'Judicial Examination Mentorship', 'Curriculum Architecture'],
    tenet: 'We transform legal education from passive rote retention into active, principled judicial deduction and analytical clarity.',
    milestone: 'Co-Architect of MSI Curriculum • 14+ Yrs Scholarly Mentorship',
    objectPosition: 'object-[center_20%]',
    stats: [
      { label: 'Academic Experience', value: '14+ Yrs' },
      { label: 'Master Series Books', value: '6 Volumes' },
      { label: 'Judicial Cohorts', value: '1,200+' },
    ],
    keyHighlights: [
      'Architect of MSI’s flagship passage-based legal analytical framework for CLAT UG and AILET.',
      'Spearheads substantive research in constitutional ethics, torts jurisprudence, and judicial pedagogy.',
      'Personal mentor to top rankers across National Law Universities and State Judicial Services.',
    ],
  },
  {
    id: 'director',
    name: 'Adv. Manav Sharma',
    role: 'Executive Director & Legal Counsel',
    designation: 'Executive Director, MSI Group of Institutes',
    badge: 'Executive Director',
    office: 'Directorate of Legal Affairs & Institutional Growth',
    dropCap: 'A',
    bioRest:
      'dv. Manav Sharma serves as Executive Director of the MSI Group of Institutes, bringing high-impact institutional governance, procedural legal mastery, and courtroom praxis to the heart of academic execution. With active practice at the High Court of Delhi and a distinguished record in appellate advocacy, he spearheads MSI’s judicial mentorship initiatives, strategic affiliations, and operational scale—instilling uncompromising professional discipline and legal acumen in every cohort.',
    image: '/images/leadership/director-manav-sharma.jpg',
    credentials: 'Advocate, High Court of Delhi • B.A. LL.B (Hons.)',
    portfolios: ['Appellate Advocacy', 'Courtroom Praxis', 'Procedural Law Mastery', 'Strategic Affiliations'],
    tenet: 'True legal excellence lies in mastering the law’s foundational purpose, procedural precision, and serving justice with unyielding integrity.',
    milestone: 'Appellate Counsel • Delhi High Court Bar • Executive Director',
    objectPosition: 'object-[center_25%]',
    stats: [
      { label: 'Courtroom Praxis', value: 'High Court' },
      { label: 'Judicial Modules', value: 'BNSS / CrPC' },
      { label: 'Strategic Scale', value: 'Pan-India' },
    ],
    keyHighlights: [
      'Practicing appellate advocate bridging High Court litigation experience with classroom pedagogy.',
      'Directs procedural law masterclasses covering Bharatiya Nagarik Suraksha Sanhita (BNSS) and CPC.',
      'Oversees national institutional expansion, student governance councils, and academic affiliations.',
    ],
  },
];

export default function LeadershipShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'bio' | 'portfolios' | 'creed' | 'credentials'>('bio');
  const [viewMode, setViewMode] = useState<'spotlight' | 'council'>('spotlight');
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [animatingIndex, setAnimatingIndex] = useState(0);

  const activeLeader = LEADERS[activeIndex];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Autoplay cycle
  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % LEADERS.length);
  }, []);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + LEADERS.length) % LEADERS.length);
  }, []);

  const selectLeader = (index: number) => {
    setActiveIndex(index);
    setAnimatingIndex(index);
  };

  useEffect(() => {
    if (!isAutoplay || isHovered || viewMode === 'council') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, 7000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAutoplay, isHovered, viewMode, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  const handleCopyQuote = (quote: string, author: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(`"${quote}" — ${author}, MSI Group of Institutes`);
      setCopiedQuote(true);
      setTimeout(() => setCopiedQuote(false), 2500);
    }
  };

  return (
    <section className="relative w-full py-16 sm:py-24">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-gradient-to-r from-[#89190E]/5 via-[#EFC988]/10 to-[#10233F]/5 blur-3xl pointer-events-none -z-10 rounded-full" />

      {/* Top Header & Interactive Mode Bar */}
      <Reveal direction="up" className="mb-10 sm:mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E8DCCB]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#89190E] animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-widest text-[#89190E] uppercase">
                Institutional Directorate
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#10233F] tracking-tight">
              The Visionary Leaders of MSI
            </h2>
            <p className="text-sm sm:text-base text-[#526174] mt-2 max-w-2xl font-normal leading-relaxed">
              Empowering students through visionary governance, pedagogical mastery, and courtroom praxis.
            </p>
          </div>

          {/* Interactive View Mode Controls */}
          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            {/* View Mode Toggle: Spotlight vs Council */}
            <div className="bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-[#E8DCCB] shadow-xs flex items-center">
              <button
                type="button"
                onClick={() => setViewMode('spotlight')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'spotlight'
                    ? 'bg-[#89190E] text-white shadow-xs'
                    : 'text-[#526174] hover:text-[#10233F]'
                }`}
                title="Interactive Spotlight View"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Spotlight</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('council')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'council'
                    ? 'bg-[#10233F] text-white shadow-xs'
                    : 'text-[#526174] hover:text-[#10233F]'
                }`}
                title="View All Leaders (Council Grid)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Executive Council</span>
              </button>
            </div>

            {/* Autoplay & Navigation (Spotlight mode) */}
            {viewMode === 'spotlight' && (
              <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-[#E8DCCB] shadow-xs">
                <button
                  type="button"
                  onClick={() => setIsAutoplay((prev) => !prev)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                    isAutoplay ? 'bg-[#FFF3DD] text-[#89190E]' : 'bg-gray-100 text-gray-500'
                  }`}
                  title={isAutoplay ? 'Pause auto-rotation' : 'Start auto-rotation'}
                >
                  {isAutoplay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[#10233F] hover:bg-[#FFF3DD] hover:text-[#89190E] transition-colors cursor-pointer"
                  title="Previous leader"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[#10233F] hover:bg-[#FFF3DD] hover:text-[#89190E] transition-colors cursor-pointer"
                  title="Next leader"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </Reveal>

      {/* SPOTLIGHT VIEW (Matching Image 4 with enhanced animation & interactivity) */}
      {viewMode === 'spotlight' && (
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="space-y-8"
        >
          {/* Executive Selector Tabs Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {LEADERS.map((leader, idx) => {
              const isSelected = activeIndex === idx;
              return (
                <button
                  key={leader.id}
                  type="button"
                  onClick={() => selectLeader(idx)}
                  className={`group relative text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center gap-3.5 ${
                    isSelected
                      ? 'bg-white border-[#89190E] shadow-[0_8px_25px_rgba(137,25,14,0.12)] ring-1 ring-[#89190E]/30 translate-y-[-2px]'
                      : 'bg-white/60 hover:bg-white border-[#E8DCCB] hover:border-[#EFC988] shadow-xs'
                  }`}
                >
                  {/* Miniature Portrait with status indicator */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-[#E8DCCB] group-hover:border-[#89190E] transition-colors">
                    <Image
                      src={leader.image}
                      alt={leader.name}
                      fill
                      className={`object-cover ${leader.objectPosition}`}
                      sizes="48px"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-t from-[#89190E]/40 via-transparent to-transparent pointer-events-none" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-[#89190E] text-white'
                            : 'bg-[#FFF3DD] text-[#89190E]'
                        }`}
                      >
                        {idx === 0 ? 'Founder' : idx === 1 ? 'Co-Founder' : 'Executive Director'}
                      </span>
                    </div>
                    <div className="font-serif text-sm sm:text-base font-bold text-[#10233F] truncate group-hover:text-[#89190E] transition-colors">
                      {leader.name}
                    </div>
                    <div className="text-[11px] text-[#526174] truncate font-medium">
                      {leader.role}
                    </div>
                  </div>

                  {/* Active Indicator Chevron / Pill */}
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-[#89190E] animate-ping flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Autoplay Progress Indicator line */}
          {isAutoplay && !isHovered && (
            <div className="w-full bg-[#E8DCCB]/60 h-1 rounded-full overflow-hidden">
              <div
                key={activeIndex}
                className="h-full bg-gradient-to-r from-[#89190E] to-[#EFC988] animate-[marqueeScroll_7s_linear_infinite]"
                style={{ width: '100%' }}
              />
            </div>
          )}

          {/* THE GRAND SPOTLIGHT CARD — Matching Reference Design with Luxury Finish */}
          <div
            key={activeLeader.id}
            className="animate-fadeIn relative bg-white rounded-3xl p-6 sm:p-10 lg:p-14 border border-[#E8DCCB] shadow-[0_20px_50px_rgba(16,35,63,0.08)] overflow-hidden"
          >
            {/* Top Crest Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#89190E] via-[#EFC988] to-[#10233F]" />

            {/* Subtle Watermark Institutional Crest */}
            <div className="absolute -bottom-10 -right-10 w-72 h-72 opacity-[0.03] pointer-events-none select-none">
              <Image
                src="/images/msi-crest.png"
                alt="MSI Crest"
                fill
                className="object-contain"
              />
            </div>

            {/* Responsive Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              
              {/* LEFT COLUMN: Executive Portrait Card (with 3D Tilt & Premium Shadow) */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <TiltCard intensity={6} glare shine className="w-full max-w-[380px] rounded-3xl">
                  <div className="relative w-full aspect-[4/4.5] sm:aspect-[4/4.6] rounded-3xl overflow-hidden bg-[#10233F] border-4 border-white shadow-[0_15px_35px_rgba(16,35,63,0.18)] group">
                    <Image
                      src={activeLeader.image}
                      alt={activeLeader.name}
                      fill
                      priority
                      className={`object-cover ${activeLeader.objectPosition} group-hover:scale-105 transition-transform duration-700 ease-out`}
                      sizes="(max-width: 768px) 100vw, 420px"
                    />

                    {/* Gradient Overlay for Vignette Depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10233F]/70 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                    {/* Top Badges on Image */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-white bg-[#10233F]/85 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EFC988]" />
                        {activeLeader.badge}
                      </span>

                      <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-xs">
                        <ShieldCheck className="w-4 h-4 text-[#89190E]" />
                      </div>
                    </div>

                    {/* Bottom Floating Pill inside Image */}
                    <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-white/40 shadow-lg text-center transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                      <div className="text-[11px] font-bold text-[#89190E] tracking-wide uppercase">
                        {activeLeader.office}
                      </div>
                      <div className="text-[10px] text-[#526174] font-medium mt-0.5 truncate">
                        {activeLeader.credentials}
                      </div>
                    </div>
                  </div>
                </TiltCard>

                {/* Stat Badges below Image */}
                <div className="grid grid-cols-3 gap-2 w-full max-w-[380px] mt-5">
                  {activeLeader.stats.map((stat, sIdx) => (
                    <div
                      key={sIdx}
                      className="bg-[#FFF9EF] border border-[#E8DCCB] rounded-2xl py-2 px-2 text-center"
                    >
                      <div className="text-xs sm:text-sm font-serif font-bold text-[#89190E]">
                        {stat.value}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-[#526174] uppercase tracking-wider font-semibold mt-0.5">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT COLUMN: The Exact Design Matching Image 4 + Interactive Enhancements */}
              <div className="lg:col-span-7 flex flex-col justify-between h-full">
                <div>
                  {/* Top Office Tag & Quick Interactive Tabs */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#89190E] bg-[#FFF3DD] border border-[#EFC988] px-3.5 py-1 rounded-full">
                      {activeLeader.office}
                    </span>

                    {/* Interactive Tab Navigator inside Card */}
                    <div className="flex items-center gap-1 bg-[#FFF9EF] p-1 rounded-xl border border-[#E8DCCB]">
                      {[
                        { id: 'bio', label: 'Biography', icon: BookOpen },
                        { id: 'portfolios', label: 'Portfolios', icon: Briefcase },
                        { id: 'creed', label: 'Philosophy', icon: Quote },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isTabActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isTabActive
                                ? 'bg-white text-[#89190E] shadow-xs border border-[#E8DCCB]'
                                : 'text-[#526174] hover:text-[#10233F]'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Leader Heading & Role Subtitle (Exact layout from image 4) */}
                  <h3 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#10233F] tracking-tight leading-tight">
                    {activeLeader.name}
                  </h3>

                  <p className="text-base sm:text-lg font-semibold text-[#89190E] mt-1.5 tracking-normal">
                    {activeLeader.role}
                  </p>

                  {/* Red Accent Underline (Distinctive feature in image 4) */}
                  <div className="w-16 h-[2.5px] bg-[#89190E] rounded-full mt-2.5 mb-6" />

                  {/* TAB 1: BIOGRAPHY (Exact Drop-Cap Presentation from Image 4) */}
                  {activeTab === 'bio' && (
                    <div className="animate-fadeIn">
                      <div className="text-[#334155] text-sm sm:text-base md:text-[16px] leading-relaxed text-justify sm:text-left">
                        {/* Drop Cap: Large Crimson Initial Letter */}
                        <span className="float-left text-4xl sm:text-5xl md:text-6xl font-serif font-black text-[#89190E] leading-none pr-3 pt-1 select-none">
                          {activeLeader.dropCap}
                        </span>
                        <span>{activeLeader.bioRest}</span>
                      </div>

                      {/* Key highlights checklist */}
                      <div className="mt-6 pt-5 border-t border-[#E8DCCB]/60 space-y-2.5">
                        {activeLeader.keyHighlights.map((hl, hIdx) => (
                          <div key={hIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#526174]">
                            <div className="w-4 h-4 rounded-full bg-[#FFF3DD] text-[#89190E] flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span>{hl}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: GOVERNANCE PORTFOLIOS */}
                  {activeTab === 'portfolios' && (
                    <div className="animate-fadeIn space-y-5">
                      <p className="text-xs sm:text-sm text-[#526174] leading-relaxed">
                        Leading strategic verticals across institutional administration, pedagogy, and student mentorship:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeLeader.portfolios.map((portfolio, pIdx) => (
                          <div
                            key={pIdx}
                            className="p-3.5 rounded-2xl bg-[#FFF9EF] border border-[#E8DCCB] hover:border-[#89190E] transition-all flex items-start gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-white text-[#89190E] border border-[#E8DCCB] flex items-center justify-center flex-shrink-0 group-hover:bg-[#89190E] group-hover:text-white transition-colors">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-[#10233F]">
                                {portfolio}
                              </div>
                              <div className="text-[11px] text-[#526174] mt-0.5">
                                Executive Strategic Vertical
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white border border-[#E8DCCB] flex items-center justify-between text-xs text-[#526174]">
                        <span className="font-mono font-semibold text-[#89190E] flex items-center gap-1.5">
                          <Award className="w-4 h-4" />
                          <span>{activeLeader.milestone}</span>
                        </span>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Active Mandate
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: LEADERSHIP PHILOSOPHY & CREED */}
                  {activeTab === 'creed' && (
                    <div className="animate-fadeIn space-y-5">
                      <div className="rounded-2xl bg-gradient-to-br from-[#10233F] to-[#1a345c] p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
                        <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-[#EFC988]/10 blur-xl pointer-events-none" />
                        <Quote className="w-8 h-8 text-[#EFC988]/50 mb-3" />
                        <blockquote className="font-serif text-lg sm:text-xl italic leading-relaxed text-white font-normal mb-4">
                          &ldquo;{activeLeader.tenet}&rdquo;
                        </blockquote>
                        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                          <span className="text-[#EFC988] font-bold">{activeLeader.name}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyQuote(activeLeader.tenet, activeLeader.name)}
                            className="flex items-center gap-1.5 text-white/80 hover:text-white px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
                          >
                            {copiedQuote ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[11px] text-emerald-300">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Copy Creed</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTTOM RIGHT SIGNATURE: Exact replica of the reference design */}
                <div className="mt-8 pt-6 border-t border-[#E8DCCB]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Council Trustee
                    </span>
                    <span className="text-xs text-[#526174]">
                      {activeLeader.credentials.split('•')[0]}
                    </span>
                  </div>

                  {/* Distinctive Red Accent Line & Right-Aligned Italic Designation */}
                  <div className="flex flex-col items-start sm:items-end self-end">
                    <div className="w-14 h-[2px] bg-[#89190E] mb-1.5 rounded-full" />
                    <p className="font-serif italic text-xs sm:text-sm text-[#526174] font-medium tracking-tight">
                      {activeLeader.designation}
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Bottom Interactive Thumbnail Gallery to switch between leaders */}
          <div className="flex items-center justify-center gap-3 pt-2">
            {LEADERS.map((leader, i) => (
              <button
                key={leader.id}
                type="button"
                onClick={() => selectLeader(i)}
                className={`transition-all duration-300 rounded-full flex items-center gap-2 px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  activeIndex === i
                    ? 'bg-[#10233F] text-white shadow-sm ring-2 ring-[#89190E]'
                    : 'bg-white text-[#526174] hover:bg-[#FFF3DD] hover:text-[#89190E] border border-[#E8DCCB]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeIndex === i ? 'bg-[#EFC988]' : 'bg-gray-300'}`} />
                <span>{leader.name.split(' ')[0]} {leader.name.split(' ')[1]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* COUNCIL VIEW (Shows all 3 leaders in the signature style side-by-side or alternating stack) */}
      {viewMode === 'council' && (
        <div className="space-y-12">
          {LEADERS.map((leader, idx) => {
            const isEven = idx % 2 === 1;
            return (
              <Reveal key={leader.id} direction="up" delay={idx * 100}>
                <div className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-[#E8DCCB] shadow-[0_15px_40px_rgba(16,35,63,0.06)] hover:shadow-[0_20px_50px_rgba(16,35,63,0.12)] hover:border-[#89190E]/60 transition-all duration-400 relative overflow-hidden group">
                  
                  {/* Top Institutional Crest Accent Strip */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#89190E] via-[#EFC988] to-[#10233F]" />

                  <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center ${isEven ? 'lg:flex-row-reverse' : ''}`}>
                    
                    {/* Portrait Frame */}
                    <div className={`lg:col-span-4 flex justify-center ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                      <TiltCard intensity={6} glare shine className="w-full max-w-[340px] rounded-3xl">
                        <div className="relative w-full aspect-[4/4.5] rounded-3xl overflow-hidden bg-[#10233F] border-4 border-white shadow-md">
                          <Image
                            src={leader.image}
                            alt={leader.name}
                            fill
                            className={`object-cover ${leader.objectPosition} group-hover:scale-105 transition-transform duration-700`}
                            sizes="(max-width: 768px) 100vw, 340px"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#10233F]/60 via-transparent to-transparent opacity-60" />
                          
                          <div className="absolute top-3 left-3">
                            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-white bg-[#10233F]/85 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                              {leader.badge}
                            </span>
                          </div>

                          <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-white/40 shadow-xs text-center">
                            <div className="text-[10px] font-bold text-[#89190E] tracking-wide uppercase">
                              {leader.office}
                            </div>
                          </div>
                        </div>
                      </TiltCard>
                    </div>

                    {/* Content Column (Matching Image 4) */}
                    <div className={`lg:col-span-8 flex flex-col justify-between ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#89190E] bg-[#FFF3DD] border border-[#EFC988] px-2.5 py-0.5 rounded-full">
                            {leader.office}
                          </span>
                        </div>

                        <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#10233F] tracking-tight group-hover:text-[#89190E] transition-colors">
                          {leader.name}
                        </h3>

                        <p className="text-sm sm:text-base font-semibold text-[#89190E] mt-1">
                          {leader.role}
                        </p>

                        {/* Signature red underline */}
                        <div className="w-16 h-[2.5px] bg-[#89190E] rounded-full mt-2 mb-5" />

                        {/* Bio with Drop-Cap letter */}
                        <div className="text-[#334155] text-sm sm:text-base leading-relaxed">
                          <span className="float-left text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-[#89190E] leading-none pr-3 pt-1 select-none">
                            {leader.dropCap}
                          </span>
                          <span>{leader.bioRest}</span>
                        </div>

                        {/* Portfolios Pills */}
                        <div className="mt-5 flex flex-wrap gap-1.5">
                          {leader.portfolios.map((portfolio, pIdx) => (
                            <span
                              key={pIdx}
                              className="text-[11px] font-semibold bg-[#FFF9EF] text-[#10233F] border border-[#E8DCCB] px-2.5 py-1 rounded-lg"
                            >
                              {portfolio}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Right Signature */}
                      <div className="mt-8 pt-4 border-t border-[#E8DCCB]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="text-xs text-[#526174]">
                          <span className="font-mono font-bold text-[#89190E]">{leader.milestone}</span>
                        </div>

                        <div className="flex flex-col items-start sm:items-end self-end">
                          <div className="w-12 h-[2px] bg-[#89190E] mb-1.5 rounded-full" />
                          <p className="font-serif italic text-xs sm:text-sm text-[#526174] font-medium">
                            {leader.designation}
                          </p>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}
