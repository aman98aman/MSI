'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import EnquiryModal from '@/components/modals/EnquiryModal';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import TiltCard from '@/components/ui/TiltCard';
import {
  BookOpen,
  Award,
  ArrowRight,
  Microscope,
  GraduationCap,
} from 'lucide-react';

interface FacultyMember {
  id: number;
  name: string;
  department: 'judiciary' | 'entrance' | 'general';
  role: string;
  degree: string;
  experience: string;
  papers: string;
  specialty: string;
  avatar: string;
  researchTags: string[];
}

export default function FacultyPage() {
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [activeDept, setActiveDept] = useState<'all' | 'judiciary' | 'entrance' | 'general'>('all');

  const facultyMembers: FacultyMember[] = [
    {
      id: 1,
      name: 'Dr. Ekta Gahlawat',
      department: 'judiciary',
      role: 'Faculty – Legal Studies, MSI Group of Institutes',
      degree: 'Ph.D. in Law, LL.M. (Constitutional Jurisprudence & Torts)',
      experience: '14+ Years',
      papers: 'MSI/LEGSTUDIES-/01 Course Director',
      specialty: 'Constitutional Law, Law of Torts, Law of Contracts & Passage-Based Principle-Fact Application',
      avatar: '/images/avatars/avatar-2.webp',
      researchTags: ['Legal Reasoning', 'Constitutional Law', 'Law of Torts', 'Law of Contracts'],
    },
    {
      id: 2,
      name: 'Mr. Anurag Dwivedi',
      department: 'general',
      role: 'Faculty – General Knowledge & Current Affairs',
      degree: 'M.A. International Relations (JNU), M.Phil. Public Policy',
      experience: '12+ Years',
      papers: 'MSI/GKCA/01 (180-Session Merged Edition)',
      specialty: 'Constitutional Developments, Geopolitics, Union Budget, Bilateral Accords & Static General Knowledge',
      avatar: '/images/avatars/avatar-1.webp',
      researchTags: ['Current Affairs', 'Geopolitics', 'Union Budget', 'Static GK'],
    },
    {
      id: 3,
      name: 'Ms. Riya Hooda',
      department: 'entrance',
      role: 'Faculty – Logical Reasoning (CLAT & AILET)',
      degree: 'M.Sc. Mathematics, Certified Analytical Reasoning Specialist',
      experience: '10+ Years',
      papers: 'MSI/LR/01 (126-Session Syllabus)',
      specialty: 'Critical Reasoning, Assumption-Negation Rule, Analytical Puzzles, Syllogisms & Coding-Decoding',
      avatar: '/images/avatars/avatar-4.webp',
      researchTags: ['Logical Reasoning', 'Critical Reasoning', 'Puzzles', 'Syllogisms'],
    },
    {
      id: 4,
      name: 'Ms. Shikha Singh',
      department: 'entrance',
      role: 'English Faculty, MSI Group of Institutes',
      degree: 'M.A. English Literature (Delhi University), UGC-NET Qualified',
      experience: '9+ Years',
      papers: 'MSI/ENGCLAT-/01 (44-Session Curriculum)',
      specialty: 'Reading Comprehension Passage Mapping, Contextual Vocabulary, Figures of Speech & Legal Texts',
      avatar: '/images/avatars/avatar-5.webp',
      researchTags: ['Reading Comprehension', 'Vocabulary', 'Grammar', 'Legal English'],
    },
    {
      id: 5,
      name: 'Dr. Vikramaditya Sharma',
      department: 'judiciary',
      role: 'Senior Professor of Procedural Law & Judicial Studies',
      degree: 'Ph.D. Constitutional Jurisprudence (DU), LL.M (Gold Medalist)',
      experience: '18+ Years',
      papers: 'MSI/PCSJ/01 Course Director',
      specialty: 'Procedural Laws (CPC, CrPC, BNSS 2023), Judgment Writing & Judicial Services',
      avatar: '/images/faculty/faculty-1.webp',
      researchTags: ['PCS J', 'CrPC / BNSS 2023', 'CPC 1908', 'Judgment Drafting'],
    },
    {
      id: 6,
      name: 'Adv. Rajesh Kumar',
      department: 'judiciary',
      role: 'Head — Judiciary & PCS J Coaching Division',
      degree: 'LL.M., Panjab University Chandigarh',
      experience: '20+ Years',
      papers: '300+ Judicial Candidate Selections',
      specialty: 'Civil Law, Criminal Trial Procedure, Law of Evidence & Mock Interview Preparation',
      avatar: '/images/avatars/avatar-3.webp',
      researchTags: ['Civil Procedure', 'Law of Evidence', 'Judicial Services', 'ADJ Exam'],
    },
  ];

  const filteredFaculty =
    activeDept === 'all' ? facultyMembers : facultyMembers.filter((f) => f.department === activeDept);

  return (
    <div className="min-h-screen bg-[#FFF9EF] text-[#10233F] flex flex-col selection:bg-[#EFC988] selection:text-[#89190E]">
      <Navbar onOpenEnquiry={() => setIsEnquiryOpen(true)} />

      <main className="flex-grow">
        {/* Page Hero */}
        <PageHero
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Distinguished Faculty' },
          ]}
          eyebrow="Scholarly Mentorship"
          title="Our Distinguished Faculty"
          subtitle="Learn from seasoned advocates, former judicial mentors, and entrance exam specialists dedicated to your legal career."
          bgImage="/images/hero-3.webp"
          className="pt-24 sm:pt-28"
        />

        {/* Aggregate Stats Strip */}
        <div className="bg-white border-b border-[#E8DCCB]">
          <div className="max-w-[1380px] mx-auto px-6 sm:px-10 lg:px-16 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { target: 50, suffix: '+', label: 'Expert Tutors', sub: 'Certified legal professors' },
                { target: 30, suffix: '+', label: 'Courses Offered', sub: 'Judiciary, CLAT & UGC NET' },
                { target: 20, suffix: '+ Avg. Years', label: 'Teaching Experience', sub: 'Per faculty specialist' },
                { target: 300, suffix: '+', label: 'Successful Selections', sub: 'Across Punjab & National exams' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="font-serif text-3xl sm:text-4xl font-bold text-[#89190E]">
                    <AnimatedCounter target={s.target} suffix={s.suffix} />
                  </div>
                  <div className="text-xs font-bold text-[#10233F] mt-1">{s.label}</div>
                  <div className="text-[11px] text-[#526174] mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-[1380px] mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-20">

          {/* Filter + Title Row */}
          <Reveal direction="up" className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <SectionHeading
              eyebrow="Faculty Directory"
              title="Filter by Specialization"
              align="left"
              className="max-w-sm"
            />
            <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-[#E8DCCB] shadow-xs overflow-x-auto w-max">
              {(['all', 'judiciary', 'entrance', 'general'] as const).map((dept) => {
                const labels: Record<string, string> = {
                  all: 'All Faculty',
                  judiciary: 'Judiciary & Procedural Law',
                  entrance: 'CLAT & Law Entrance',
                  general: 'General Studies & Reasoning',
                };
                return (
                  <button
                    key={dept}
                    onClick={() => setActiveDept(dept)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeDept === dept ? 'bg-[#89190E] text-white shadow-sm' : 'text-[#526174] hover:text-[#10233F]'
                    }`}
                  >
                    {labels[dept]}
                  </button>
                );
              })}
            </div>
          </Reveal>

          {/* Faculty Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {filteredFaculty.map((member, idx) => (
              <Reveal key={member.id} direction="up" delay={idx * 60}>
                <TiltCard className="rounded-3xl h-full" intensity={6} glare shine>
                  <div className="bg-white border border-[#E8DCCB] rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:border-[#EFC988] transition-all duration-400 flex flex-col justify-between group h-full">
                    <div>
                      {/* Horizontal avatar + name row */}
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#EFC988] group-hover:border-[#89190E] relative bg-[#FFF3DD] flex-shrink-0 shadow-sm transition-all duration-300 group-hover:scale-105">
                          <Image src={member.avatar} alt={member.name} fill className="object-cover" sizes="80px" />
                        </div>
                        <div>
                          <h3 className="font-serif text-xl font-bold text-[#10233F] group-hover:text-[#89190E] transition-colors leading-tight">
                            {member.name}
                          </h3>
                          <p className="text-xs text-[#89190E] font-semibold mt-1">{member.role}</p>
                        </div>
                      </div>

                      <div className="bg-[#FFF9EF] p-3.5 rounded-2xl border border-[#E8DCCB] mb-5">
                        <span className="text-xs font-bold text-[#10233F] flex items-center">
                          <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-[#89190E]" />
                          {member.degree}
                        </span>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-white border border-[#E8DCCB] p-2.5 rounded-xl text-center">
                          <span className="text-[10px] text-[#526174] uppercase font-bold block">Experience</span>
                          <span className="font-serif text-sm font-bold text-[#89190E]">{member.experience}</span>
                        </div>
                        <div className="bg-white border border-[#E8DCCB] p-2.5 rounded-xl text-center">
                          <span className="text-[10px] text-[#526174] uppercase font-bold block">Research</span>
                          <span className="font-serif text-sm font-bold text-[#10233F]">{member.papers}</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#526174] leading-relaxed mb-5">
                        <span className="font-bold text-[#10233F]">Areas of Focus: </span>
                        {member.specialty}
                      </p>

                      {/* Research Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {member.researchTags.map((tag, tIdx) => (
                          <span key={tIdx} className="text-[10px] font-semibold bg-[#FFF3DD] text-[#89190E] border border-[#F7E5BF] px-2.5 py-0.5 rounded-full group-hover:bg-[#89190E]/10 transition-colors">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setIsEnquiryOpen(true)}
                      className="w-full h-11 rounded-xl bg-[#FFF9EF] hover:bg-[#89190E] hover:text-white text-[#89190E] border border-[#89190E]/40 font-semibold text-xs transition-all flex items-center justify-center space-x-1.5 group/btn"
                    >
                      <span>Connect for Mentorship</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>

          {/* Join us CTA */}
          <Reveal direction="up">
            <div className="rounded-3xl bg-[#10233F] p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#EFC988] block mb-2">Join MSI</span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold">
                  Interested in a Faculty Position?
                </h3>
                <p className="text-gray-300 text-sm mt-2 max-w-xl">
                  MSI actively recruits distinguished academics and industry practitioners. Submit your CV and research portfolio.
                </p>
              </div>
              <button
                onClick={() => setIsEnquiryOpen(true)}
                className="h-12 px-7 rounded-xl bg-[#89190E] hover:bg-[#65130D] text-white font-bold text-sm transition-all btn-hover-lift flex-shrink-0 flex items-center space-x-2"
              >
                <span>Submit Application</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Reveal>
        </div>
      </main>

      <Footer />
      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />
    </div>
  );
}
