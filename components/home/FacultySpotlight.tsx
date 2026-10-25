'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/ui/Reveal';
import TiltCard from '@/components/ui/TiltCard';
import {
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  Clock,
  ShieldCheck,
  Star,
  Award,
  Users,
  Sparkles,
} from 'lucide-react';

const faculty = [
  {
    name: 'Dr. Ekta Gahlawat',
    role: 'Faculty – Legal Studies',
    degree: 'Ph.D. in Law, LL.M. (Jurisprudence)',
    experience: '14+ Years',
    papers: 'MSI/LEGSTUDIES-/01',
    specialty: 'Constitutional Law, Law of Torts & Passage-Based Principle-Fact Application',
    avatar: '/images/avatars/avatar-2.webp',
    dept: 'Legal Reasoning',
    accentColor: '#89190E',
    tags: ['CLAT Legal', 'Constitutional Law', 'Torts'],
  },
  {
    name: 'Mr. Anurag Dwivedi',
    role: 'Faculty – GK & Current Affairs',
    degree: 'M.A. International Relations (JNU), M.Phil.',
    experience: '12+ Years',
    papers: 'MSI/GKCA/01 (180 Sessions)',
    specialty: 'Supreme Court Constitution-Bench Reasoning, Geopolitics & Static GK',
    avatar: '/images/avatars/avatar-1.webp',
    dept: 'Current Affairs & GK',
    accentColor: '#10233F',
    tags: ['GK & CA', 'Geopolitics', 'Static GK'],
  },
  {
    name: 'Ms. Riya Hooda',
    role: 'Faculty – Logical Reasoning',
    degree: 'M.Sc. Mathematics, Analytical Specialist',
    experience: '10+ Years',
    papers: 'MSI/LR/01 (126 Sessions)',
    specialty: 'Critical Reasoning, Assumption-Negation Rule & Analytical Puzzles',
    avatar: '/images/avatars/avatar-4.webp',
    dept: 'Logical Reasoning',
    accentColor: '#89190E',
    tags: ['Logical Reasoning', 'Critical Reasoning', 'Puzzles'],
  },
  {
    name: 'Dr. Vikramaditya Sharma',
    role: 'Senior Professor of Procedural Law',
    degree: 'Ph.D. Constitutional Jurisprudence, LL.M (Gold Medalist)',
    experience: '18+ Years',
    papers: 'MSI/PCSJ/01 Course Director',
    specialty: 'Procedural Laws (CPC, CrPC, BNSS 2023), Judgment Writing & Judicial Mentorship',
    avatar: '/images/faculty/faculty-1.webp',
    dept: 'Judiciary & PCS J',
    accentColor: '#10233F',
    tags: ['PCS J', 'BNSS 2023', 'Judgment Drafting'],
  },
];

const highlights = [
  { icon: Users, value: '50+', label: 'Expert Mentors' },
  { icon: Award, value: '30+', label: 'Years of Legacy' },
  { icon: Star, value: '4.9', label: 'Avg. Student Rating' },
];

export default function FacultySpotlight() {
  return (
    <section
      className="relative py-24 sm:py-32 overflow-hidden bg-[#0A1628] text-white"
      aria-label="Faculty Spotlight"
    >
      {/* ---------- Luxe ambient background ---------- */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(1000px 520px at 85% -10%, rgba(137,25,14,0.45), transparent 60%), radial-gradient(900px 500px at 0% 110%, rgba(239,201,136,0.18), transparent 60%), linear-gradient(180deg, #0A1628 0%, #0E1F3A 55%, #0A1628 100%)',
        }}
      />
      {/* Fine grid texture */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
      {/* Gold hairlines */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#EFC988]/60 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#EFC988]/40 to-transparent" />

      <div className="relative z-10 max-w-[1380px] mx-auto px-6 sm:px-10 lg:px-16">
        {/* ---------- Heading row ---------- */}
        <Reveal
          direction="up"
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14 sm:mb-16"
        >
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#EFC988]/30 bg-white/5 backdrop-blur-md mb-5">
              <Sparkles className="w-3.5 h-3.5 text-[#EFC988]" />
              <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#EFC988]">
                Scholarly Mentorship
              </span>
            </div>
            <h2 className="font-serif text-[36px] sm:text-[52px] lg:text-[58px] leading-[1.05] font-bold tracking-tight">
              Distinguished{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#F6DFAE] via-[#EFC988] to-[#C99A4E] bg-clip-text text-transparent italic">
                  Faculty
                </span>
              </span>{' '}
              Leaders
            </h2>
            <p className="mt-5 text-[15px] sm:text-[17px] text-white/65 leading-relaxed max-w-xl">
              Learn from acclaimed legal researchers, constitutional scholars, and judicial mentors
              who have shaped thousands of successful careers.
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-6">
            {/* Highlights ribbon */}
            <div className="flex items-stretch divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
              {highlights.map(({ icon: Icon, value, label }) => (
                <div key={label} className="px-4 sm:px-6 py-3.5 text-left">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-[#EFC988]" />
                    <span className="font-serif text-xl sm:text-2xl font-bold text-white">
                      {value}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/50 font-semibold">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/faculty"
              className="group inline-flex items-center gap-2.5 pl-6 pr-2 py-2 rounded-full bg-gradient-to-r from-[#F6DFAE] via-[#EFC988] to-[#D6A85C] text-[#10233F] text-sm font-bold shadow-[0_10px_40px_-10px_rgba(239,201,136,0.6)] hover:shadow-[0_14px_50px_-8px_rgba(239,201,136,0.8)] transition-all duration-300"
            >
              <span>Meet All Faculty</span>
              <span className="w-8 h-8 rounded-full bg-[#10233F] text-[#EFC988] flex items-center justify-center transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </Reveal>

        {/* ---------- Cards grid ---------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 items-stretch">
          {faculty.map((member, idx) => (
            <Reveal key={member.name} direction="up" delay={idx * 90}>
              <TiltCard className="rounded-[28px] h-full" intensity={5} glare shine>
                {/* Gradient border shell */}
                <div className="group relative h-full rounded-[28px] p-px bg-gradient-to-b from-[#EFC988]/70 via-white/10 to-white/5 hover:from-[#EFC988] hover:via-[#EFC988]/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_80px_-20px_rgba(239,201,136,0.35)]">
                  <article className="relative h-full flex flex-col rounded-[27px] bg-gradient-to-b from-[#132A4C] to-[#0C1A31] overflow-hidden">
                    {/* Index watermark */}
                    <span
                      className="absolute top-3 right-5 font-serif text-[64px] leading-none font-bold text-white/[0.04] select-none pointer-events-none"
                      aria-hidden="true"
                    >
                      0{idx + 1}
                    </span>

                    {/* Portrait */}
                    <div className="relative p-3 pb-0">
                      <div className="relative aspect-[4/3.6] rounded-[22px] overflow-hidden ring-1 ring-white/10">
                        <Image
                          src={member.avatar}
                          alt={member.name}
                          fill
                          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-110"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                        {/* Portrait overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0C1A31] via-[#0C1A31]/20 to-transparent" />

                        {/* Top chips */}
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold tracking-[0.12em] uppercase px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/15 text-white truncate">
                            {member.dept}
                          </span>
                          <span
                            className="w-7 h-7 flex-shrink-0 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-300/40 flex items-center justify-center"
                            title="Verified Faculty"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                          </span>
                        </div>

                        {/* Bottom rating pill */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFC988] text-[#10233F] shadow-lg">
                          <Star className="w-3 h-3 fill-[#10233F]" />
                          <span className="text-[11px] font-extrabold">4.9</span>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="relative flex-grow flex flex-col px-5 sm:px-6 pt-5 pb-6">
                      <h3 className="font-serif text-xl sm:text-[22px] font-bold leading-snug text-white group-hover:text-[#F6DFAE] transition-colors">
                        {member.name}
                      </h3>
                      <p className="text-[12px] font-semibold text-[#EFC988]/90 mt-1 line-clamp-1">
                        {member.role}
                      </p>

                      {/* Gold divider */}
                      <div className="my-4 h-px w-full bg-gradient-to-r from-[#EFC988]/50 via-white/10 to-transparent" />

                      {/* Degree */}
                      <div className="flex items-start gap-2 text-[12.5px] text-white/80 mb-3">
                        <GraduationCap className="w-4 h-4 text-[#EFC988] flex-shrink-0 mt-0.5" />
                        <span className="font-medium line-clamp-2 leading-snug">{member.degree}</span>
                      </div>

                      {/* Experience */}
                      <div className="flex items-center gap-2 text-[12.5px] text-white/80 mb-4">
                        <Clock className="w-4 h-4 text-[#EFC988] flex-shrink-0" />
                        <span>
                          <span className="font-serif font-bold text-white">{member.experience}</span>{' '}
                          <span className="text-white/55">of mentoring</span>
                        </span>
                      </div>

                      {/* Focus */}
                      <p className="text-[12.5px] text-white/55 leading-relaxed line-clamp-2 mb-4">
                        <span className="text-white/85 font-semibold">Focus: </span>
                        {member.specialty}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {member.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/80 group-hover:border-[#EFC988]/30 transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* CTA */}
                      <Link
                        href="/faculty"
                        className="mt-auto relative w-full h-11 rounded-xl overflow-hidden border border-[#EFC988]/40 text-[#EFC988] group-hover:text-[#10233F] font-bold text-[11.5px] uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-colors duration-300"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-[#F6DFAE] via-[#EFC988] to-[#D6A85C] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                        <span className="relative">View Profile</span>
                        <ArrowRight className="relative w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </article>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
