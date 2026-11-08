'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import EnquiryModal from '@/components/modals/EnquiryModal';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { ArrowRight, Clock, Calendar, Mail, BookOpen, Send, CheckCircle2 } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  category: 'judiciary' | 'clat' | 'pu-law' | 'legal-insights';
  categoryLabel: string;
  date: string;
  readTime: string;
  excerpt: string;
  author: string;
  authorRole: string;
  avatar: string;
  featured?: boolean;
}

export default function BlogPage() {
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'judiciary' | 'clat' | 'pu-law' | 'legal-insights'>('all');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const articles: Article[] = [
    {
      id: 1,
      title: 'Cracking PCS (Judicial Services): Strategy, Judgment Writing & High Court Precedents',
      category: 'judiciary',
      categoryLabel: 'Judicial Services',
      date: 'September 2026',
      readTime: '6 min read',
      excerpt: 'A comprehensive roadmap for mastering Civil Law, Criminal Procedure, BNSS 2023, and scoring high in Mains judgment writing.',
      author: 'Adv. Rajesh Kumar',
      authorRole: 'Head — Judiciary & PCS J Division',
      avatar: '/images/avatars/avatar-3.webp',
      featured: true,
    },
    {
      id: 2,
      title: 'National Moot Court Victory: MSI Law Delegation Triumphs on Constitutional Rights',
      category: 'legal-insights',
      categoryLabel: 'Legal Jurisprudence',
      date: 'August 2026',
      readTime: '6 min read',
      excerpt: 'An inside look at our 5-year integrated law students formulating appellate arguments before a simulated 5-judge Supreme Court bench.',
      author: 'Dr. Ekta Gahlawat',
      authorRole: 'Faculty – Legal Studies, MSI',
      avatar: '/images/avatars/avatar-2.webp',
    },
    {
      id: 3,
      title: 'Mastering CLAT & Law Entrance: Tackling Passage-Based Reasoning & High-Yield Legal GK',
      category: 'clat',
      categoryLabel: 'CLAT & NLUs',
      date: 'August 2026',
      readTime: '5 min read',
      excerpt: 'Proven test strategies for scoring high in Critical Reasoning, Passage Mapping, and Static GK for NLU admissions.',
      author: 'Ms. Riya Hooda',
      authorRole: 'Faculty – Logical Reasoning',
      avatar: '/images/avatars/avatar-5.webp',
    },
    {
      id: 4,
      title: 'Panjab University (PU) Law Entrance: 10-Year Paper Breakdown & High-Yield Strategy',
      category: 'pu-law',
      categoryLabel: 'PU Law Entrance',
      date: 'July 2026',
      readTime: '5 min read',
      excerpt: 'Detailed analysis of Panjab University 3-Year & 5-Year Law entrance exam patterns, cutoff trends, and high-frequency topics.',
      author: 'Mr. Anurag Dwivedi',
      authorRole: 'Faculty – General Knowledge & Current Affairs',
      avatar: '/images/avatars/avatar-1.webp',
    },
    {
      id: 5,
      title: 'The New Criminal Laws (BNS, BNSS, BSA 2023): What Judicial & CLAT Aspirants Must Master',
      category: 'judiciary',
      categoryLabel: 'Judicial Services',
      date: 'July 2026',
      readTime: '7 min read',
      excerpt: 'Examining key statutory shifts from IPC, CrPC, and Indian Evidence Act to the newly enacted Bharatiya Nyaya and Suraksha Sanhitas.',
      author: 'Dr. Vikramaditya Sharma',
      authorRole: 'Senior Professor of Procedural Law',
      avatar: '/images/avatars/avatar-4.webp',
    },
    {
      id: 6,
      title: 'How to Approach Reading Comprehension in CLAT: Speed Mapping & Contextual Vocabulary',
      category: 'clat',
      categoryLabel: 'CLAT & NLUs',
      date: 'June 2026',
      readTime: '5 min read',
      excerpt: 'Mastering the 450-word passage format with active annotation, eliminative reasoning, and argument structure breakdown.',
      author: 'Ms. Shikha Singh',
      authorRole: 'English Faculty, MSI',
      avatar: '/images/avatars/avatar-2.webp',
    },
  ];

  const featuredArticle = articles.find((a) => a.featured);
  const regularArticles = articles.filter((a) => !a.featured);

  const filteredArticles =
    activeCategory === 'all'
      ? regularArticles
      : regularArticles.filter((a) => a.category === activeCategory);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubmitted(true);
      setNewsletterEmail('');
    }
  };

  const filters = [
    { key: 'all', label: 'All Articles' },
    { key: 'judiciary', label: 'Judicial Services' },
    { key: 'clat', label: 'CLAT & NLUs' },
    { key: 'pu-law', label: 'PU Law Entrance' },
    { key: 'legal-insights', label: 'Legal Jurisprudence' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#FFF9EF] text-[#10233F] flex flex-col selection:bg-[#EFC988] selection:text-[#89190E]">
      <Navbar onOpenEnquiry={() => setIsEnquiryOpen(true)} />

      <main className="flex-grow">
        {/* Page Hero */}
        <PageHero
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Institute News & Journal' },
          ]}
          eyebrow="Scholarly Thought & Stories"
          title="MSI Gazette & Research Insights"
          subtitle="Read essays, research findings, competition victories, and institute updates written by MSI faculty and student leaders."
          bgImage="/images/hero-3.webp"
          className="pt-24 sm:pt-28"
        />

        <div className="max-w-[1380px] mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-20">

          {/* Featured Article Hero */}
          {featuredArticle && (
            <Reveal direction="up" className="mb-16">
              <div className="bg-[#10233F] rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 min-h-[360px] border border-[#E8DCCB] shadow-xl">
                {/* Left content */}
                <div className="p-8 sm:p-10 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center space-x-2 mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#EFC988]/15 text-[#EFC988] border border-[#EFC988]/30">
                        ⭐ Featured Story
                      </span>
                      <span className="text-xs text-white/50 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {featuredArticle.readTime}
                      </span>
                    </div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-snug mb-4">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-white/60 text-sm leading-relaxed">{featuredArticle.excerpt}</p>
                  </div>
                  <div className="mt-8 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden relative border border-[#EFC988]">
                        <Image src={featuredArticle.avatar} alt={featuredArticle.author} fill className="object-cover" sizes="40px" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{featuredArticle.author}</span>
                        <span className="text-[10px] text-white/50">{featuredArticle.date}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEnquiryOpen(true)}
                      className="h-10 px-5 rounded-xl bg-[#89190E] hover:bg-[#65130D] text-white font-bold text-xs flex items-center space-x-1.5 transition-all"
                    >
                      <span>Read Full Article</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right image */}
                <div className="relative min-h-[280px] lg:min-h-0">
                  <Image src="/images/hero-2.webp" alt={featuredArticle.title} fill className="object-cover" sizes="50vw" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#10233F] via-[#10233F]/20 to-transparent lg:block hidden" />
                </div>
              </div>
            </Reveal>
          )}

          {/* Category Filter + Grid */}
          <Reveal direction="up" className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-10">
            <SectionHeading
              eyebrow="All Articles"
              title="Browse by Category"
              align="left"
              className="max-w-xs"
            />
            <div className="flex items-center flex-wrap gap-2 bg-white p-2 rounded-2xl border border-[#E8DCCB] shadow-xs overflow-x-auto">
              {filters.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeCategory === key ? 'bg-[#89190E] text-white shadow-sm' : 'text-[#526174] hover:text-[#10233F]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {filteredArticles.map((article, idx) => (
              <Reveal key={article.id} direction="up" delay={idx * 70}>
                <article
                  className="bg-white rounded-3xl p-8 border border-[#E8DCCB] shadow-sm hover:shadow-2xl transition-all duration-400 hover:-translate-y-2 flex flex-col justify-between group cursor-pointer"
                  onClick={() => setIsEnquiryOpen(true)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#89190E] bg-[#FFF3DD] border border-[#F7E5BF] px-3 py-1 rounded-full">
                        {article.categoryLabel}
                      </span>
                      <span className="text-xs text-[#526174] flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-[#89190E]" />
                        {article.readTime}
                      </span>
                    </div>

                    <h2 className="font-serif text-xl font-bold text-[#10233F] group-hover:text-[#89190E] transition-colors leading-snug mb-3">
                      {article.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#526174] leading-relaxed mb-6">{article.excerpt}</p>
                  </div>

                  <div className="pt-5 border-t border-[#E8DCCB]/80 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden relative border border-[#EFC988] flex-shrink-0">
                        <Image src={article.avatar} alt={article.author} fill className="object-cover" sizes="36px" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#10233F] block">{article.author}</span>
                        <span className="text-[10px] text-[#526174] flex items-center">
                          <Calendar className="w-2.5 h-2.5 mr-1" />
                          {article.date}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-[#89190E] font-bold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                      <span>Read</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          {/* Newsletter Sign-up */}
          <Reveal direction="up">
            <div className="rounded-3xl bg-gradient-to-br from-[#10233F] to-[#1c355e] p-8 sm:p-12 text-white relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#EFC988]/8" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-[#89190E]/15" />
              <div className="relative z-10 max-w-2xl mx-auto text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#EFC988]/15 flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-7 h-7 text-[#EFC988]" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-3">Stay Informed with MSI Insights</h3>
                <p className="text-white/60 text-sm mb-8">
                  Subscribe to our monthly newsletter for research highlights, placement reports, and institute news delivered to your inbox.
                </p>

                {newsletterSubmitted ? (
                  <div className="flex items-center justify-center space-x-2 bg-emerald-500/15 border border-emerald-400/30 rounded-2xl px-6 py-4 text-emerald-300 font-semibold text-sm animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Subscribed! Welcome to the MSI community.</span>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="flex-1 h-12 px-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#EFC988]/60 transition-colors"
                    />
                    <button
                      type="submit"
                      className="h-12 px-6 bg-[#89190E] hover:bg-[#65130D] text-white font-bold text-sm rounded-xl transition-all btn-hover-lift flex items-center space-x-2 flex-shrink-0"
                    >
                      <span>Subscribe</span>
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </main>

      <Footer />
      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />
    </div>
  );
}
