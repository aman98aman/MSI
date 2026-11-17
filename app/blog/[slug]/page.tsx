import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import Reveal from '@/components/ui/Reveal';
import { getBlogBySlugAsync, getBlogsAsync, GazetteArticle } from '@/lib/blogStore';
import {
  Calendar,
  Clock,
  ArrowLeft,
  Share2,
  BookOpen,
  Award,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import BlogShareButton from '@/components/blog/BlogShareButton';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getBlogBySlugAsync(slug);

  if (!article) {
    return {
      title: 'Article Not Found | MSI Group of Institutes',
      description: 'The requested scholarly dispatch or article could not be found.',
    };
  }

  const title = article.metaTitle || `${article.title} | MSI Group of Institutes`;
  const description =
    article.metaDescription ||
    article.excerpt ||
    'Scholarly dispatch and legal research publication from MSI Group of Institutes.';
  const canonical =
    article.canonicalUrl || `https://www.msiinstitutes.com/blog/${article.slug || slug}`;
  const ogImage = article.coverImage || '/images/hero-2.webp';

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'MSI Group of Institutes',
      type: 'article',
      images: [
        {
          url: ogImage.startsWith('http') ? ogImage : `https://msiinstitutes.com${ogImage}`,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage.startsWith('http') ? ogImage : `https://msiinstitutes.com${ogImage}`],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const article = await getBlogBySlugAsync(slug);

  if (!article) {
    notFound();
  }

  // Fetch 3 related articles
  const allArticles = await getBlogsAsync(false);
  const related = allArticles
    .filter((a) => a.id !== article.id && a.slug !== article.slug)
    .slice(0, 3);

  const fullUrl =
    article.canonicalUrl || `https://www.msiinstitutes.com/blog/${article.slug}`;

  // Content formatting helper — strip any raw HTML h1 tags from content
  // (the page template already renders article.title as <h1>)
  const rawContent = (article.content || article.fullSummary || article.excerpt)
    .replace(/<h1[^>]*>.*?<\/h1>/gi, '')
    .trim();

  // Check if the content is primarily HTML (contains tags like <p>, <h2>, <strong>, <a>, etc.)
  const isHtmlContent = /<(?:p|h[2-6]|div|ul|ol|li|strong|em|a|br|img|blockquote|table|span)\b/i.test(rawContent);

  const paragraphs = isHtmlContent
    ? [] // Don't split HTML content into paragraphs
    : rawContent
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#FFF9EF] text-[#10233F] flex flex-col selection:bg-[#EFC988] selection:text-[#89190E]">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-28">
        {/* Breadcrumb Navigation Strip */}
        <div className="bg-white border-b border-[#E8DCCB]">
          <div className="max-w-[1240px] mx-auto px-6 sm:px-10 py-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-[#526174]">
              <Link href="/" className="hover:text-[#89190E] transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-[#89190E] transition-colors">
                Journal & Gazette
              </Link>
              <span>/</span>
              <span className="text-[#89190E] font-semibold max-w-[240px] sm:max-w-md truncate">
                {article.title}
              </span>
            </div>

            <Link
              href="/blog"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#89190E] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Articles</span>
            </Link>
          </div>
        </div>

        {/* Article Header Hero */}
        <header className="relative bg-gradient-to-b from-white via-white to-[#FFF9EF] border-b border-[#E8DCCB] py-12 sm:py-16">
          <div className="max-w-[1000px] mx-auto px-6 sm:px-10">
            {/* Meta category badge & read time */}
            <div className="flex items-center flex-wrap gap-2.5 mb-6">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#89190E]/10 text-[#89190E] border border-[#89190E]/20">
                {article.categoryLabel || 'Legal Insights'}
              </span>
              <span className="text-xs text-[#526174] flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#89190E]" />
                {article.readTime || '5 min read'}
              </span>
              <span className="text-xs text-[#526174] flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#89190E]" />
                {article.date || 'Recent Dispatch'}
              </span>
              {article.badge && (
                <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#EFC988]/20 text-[#89190E] border border-[#EFC988]">
                  ⭐ {article.badge}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#10233F] leading-[1.18] tracking-tight mb-6">
              {article.title}
            </h1>

            {/* Lead Excerpt */}
            {article.excerpt && (
              <p className="text-base sm:text-lg text-[#526174] leading-relaxed font-sans mb-8 border-l-4 border-[#89190E] pl-4 italic">
                {article.excerpt}
              </p>
            )}

            {/* Author info & Share button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-[#E8DCCB]">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-full overflow-hidden relative border-2 border-[#EFC988] shrink-0 shadow-xs">
                  <Image
                    src={article.avatar || '/images/avatars/avatar-1.webp'}
                    alt={article.author}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#10233F]">{article.author}</div>
                  <div className="text-xs text-[#526174] font-medium">
                    {article.authorRole || 'Faculty of Law, MSI Group of Institutes'}
                  </div>
                </div>
              </div>

              {/* Share Button (copies clean URL with NO #) */}
              <BlogShareButton
                title={article.title}
                url={fullUrl}
                slug={article.slug}
              />
            </div>
          </div>
        </header>

        {/* Article Body Container */}
        <article className="max-w-[1000px] mx-auto px-6 sm:px-10 py-12 sm:py-16">
          {/* Cover image if available */}
          {article.coverImage && (
            <div className="relative w-full h-[320px] sm:h-[440px] md:h-[500px] rounded-3xl overflow-hidden mb-12 shadow-xl border border-[#E8DCCB]">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1000px"
              />
            </div>
          )}

          {/* Key Takeaways Highlight Box */}
          {Array.isArray(article.keyTakeaways) && article.keyTakeaways.length > 0 && (
            <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 border border-[#E8DCCB] shadow-sm">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#89190E] mb-3">
                <Sparkles className="w-4 h-4" />
                <span>Executive Key Takeaways for Aspirants</span>
              </div>
              <ul className="space-y-2.5">
                {article.keyTakeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start text-xs sm:text-sm text-[#10233F] leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-[#89190E] mr-2.5 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Content — HTML or Markdown paragraphs */}
          <div className="space-y-6 text-sm sm:text-base text-[#2C3E50] leading-relaxed font-sans">
            {isHtmlContent ? (
              <div
                className="blog-html-content max-w-none"
                dangerouslySetInnerHTML={{ __html: rawContent }}
              />
            ) : (
              paragraphs.map((p, idx) => {
              if (p.startsWith('## ') || p.startsWith('### ')) {
                const headingText = p.replace(/^#+\s*/, '');
                return (
                  <h2
                    key={idx}
                    className="font-serif text-2xl sm:text-3xl font-bold text-[#10233F] pt-6 pb-2 border-b border-[#E8DCCB]/60"
                  >
                    {headingText}
                  </h2>
                );
              }
              if (p.startsWith('> ')) {
                return (
                  <blockquote
                    key={idx}
                    className="my-6 pl-5 border-l-4 border-[#89190E] bg-white p-4 rounded-r-2xl italic text-[#10233F] font-serif shadow-2xs"
                  >
                    {p.replace(/^>\s*/, '')}
                  </blockquote>
                );
              }
              if (p.startsWith('- ') || p.startsWith('* ')) {
                const items = p.split('\n').map((line) => line.replace(/^[-*]\s*/, ''));
                return (
                  <ul key={idx} className="space-y-2 my-4 pl-4 list-disc marker:text-[#89190E]">
                    {items.map((it, i) => (
                      <li key={i}>{it}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={idx} className="text-justify sm:text-left leading-relaxed">
                  {p}
                </p>
              );
              })
            )}
          </div>

          {/* Statutes Cited Pills */}
          {Array.isArray(article.statutesCited) && article.statutesCited.length > 0 && (
            <div className="mt-12 pt-8 border-t border-[#E8DCCB]">
              <div className="text-xs font-bold uppercase tracking-wider text-[#526174] mb-3">
                Key Statutes, Sections & Constitutional Articles Cited:
              </div>
              <div className="flex flex-wrap gap-2">
                {article.statutesCited.map((stat, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl bg-white border border-[#E8DCCB] text-xs font-mono font-semibold text-[#89190E]"
                  >
                    ⚖️ {stat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author Box */}
          <div className="mt-14 bg-white rounded-3xl p-6 sm:p-8 border border-[#E8DCCB] shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-16 h-16 rounded-full overflow-hidden relative border-2 border-[#EFC988] shrink-0 shadow-xs">
              <Image
                src={article.avatar || '/images/avatars/avatar-1.webp'}
                alt={article.author}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="text-center sm:text-left flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#89190E]">
                Published by Academic Faculty
              </div>
              <h3 className="font-serif text-lg font-bold text-[#10233F]">
                {article.author}
              </h3>
              <p className="text-xs text-[#526174] mb-3">{article.authorRole}</p>
              <p className="text-xs text-[#2C3E50] leading-relaxed">
                Faculty mentor at MSI Group of Institutes, specializing in judicial service preparation, entrance aptitude analysis, and judgment drafting frameworks.
              </p>
            </div>
          </div>

          {/* Academic Counseling CTA */}
          <div className="mt-10 bg-gradient-to-r from-[#10233F] to-[#1c355e] text-white rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden shadow-xl border border-[#EFC988]/30">
            <div className="relative z-10 max-w-xl mx-auto">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EFC988]/20 text-[#EFC988] border border-[#EFC988]/30 inline-block mb-3">
                Admissions & Guidance Open
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-3">
                Preparing for PCS (J), CLAT or PU Law?
              </h3>
              <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-6">
                Connect with our academic counseling team for comprehensive syllabus breakdowns, previous-year question trends, and merit scholarship guidance.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href="tel:+917508420013"
                  className="px-6 py-3 rounded-xl bg-[#89190E] hover:bg-[#65130D] text-white text-xs font-bold shadow-md transition-all flex items-center space-x-2"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Admissions: +91 75084 20013</span>
                </a>
                <Link
                  href="/contact"
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all"
                >
                  Visit Campus / Request Callback
                </Link>
              </div>
            </div>
          </div>
        </article>

        {/* Related Articles Section */}
        {related.length > 0 && (
          <section className="bg-white border-t border-[#E8DCCB] py-16">
            <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#89190E]">
                    Keep Reading
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-[#10233F]">
                    Related Articles & Faculty Insights
                  </h2>
                </div>
                <Link
                  href="/blog"
                  className="text-xs font-bold text-[#89190E] hover:underline flex items-center space-x-1"
                >
                  <span>View All Dispatches</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/blog/${rel.slug}`}
                    className="p-6 rounded-3xl bg-[#FFF9EF] border border-[#E8DCCB] hover:border-[#89190E]/40 hover:shadow-lg transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#526174] mb-3">
                        <span className="text-[#89190E] uppercase">{rel.categoryLabel}</span>
                        <span>{rel.readTime}</span>
                      </div>
                      <h3 className="font-serif text-base font-bold text-[#10233F] group-hover:text-[#89190E] transition-colors leading-snug mb-2">
                        {rel.title}
                      </h3>
                      <p className="text-xs text-[#526174] line-clamp-2 leading-relaxed">
                        {rel.excerpt}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-[#E8DCCB] mt-4 flex items-center justify-between text-xs font-bold text-[#89190E]">
                      <span>Read Dispatch</span>
                      <span>→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

