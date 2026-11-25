'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Sparkles,
  X,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Download,
  BookOpen,
  Award,
} from 'lucide-react';
import RazorpayCheckoutModal, {
  RazorpayPaymentSuccessInfo,
} from '@/components/payments/RazorpayCheckoutModal';
import PdfViewerModal from '@/components/modals/PdfViewerModal';
import { getStoredCourses, enrollStudentAction, MSICourse } from '@/lib/lmsStore';

interface MockTestOfferPopupProps {
  onDismiss?: () => void;
}

export default function MockTestOfferPopup({ onDismiss }: MockTestOfferPopupProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [viewingPdfUrl, setViewingPdfUrl] = useState('');
  const [viewingPdfTitle, setViewingPdfTitle] = useState('');
  const [clatCourse, setClatCourse] = useState<{
    id: string;
    title: string;
    price: number;
    originalPrice: number;
    pdfUrl?: string;
  }>({
    id: 'crs-clat-pg-mock-2027',
    title: 'CLAT PG MOCK TEST 2027',
    price: 50,
    originalPrice: 999,
  });

  // 1. Detect when splash screen finishes and load featured popup course
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const checkAndShow = () => {
      const dismissed = typeof window !== 'undefined' && sessionStorage.getItem('msi_clat_mock_popup_dismissed');
      if (dismissed === 'true') {
        setIsMinimized(true);
        setIsVisible(true);
        return;
      }

      const splashDone = typeof window !== 'undefined' && sessionStorage.getItem('msi_splash_viewed');
      const delay = splashDone ? 600 : 1800;

      timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    };

    checkAndShow();

    // 2. Fetch official featured course selected by admin ("Show as Live Offer on Home Screen")
    const loadPopupCourse = async () => {
      try {
        const res = await fetch('/api/courses');
        const data = await res.json();
        const courses: MSICourse[] = data?.courses || getStoredCourses();
        
        // Priority 1: Course explicitly toggled with showOnHomeScreenPopup: true
        // Priority 2: CLAT PG or Mock Test course
        const featured =
          courses.find((c) => c.showOnHomeScreenPopup === true) ||
          courses.find((c) => c.title.toLowerCase().includes('clat pg') || c.price === 50);

        if (featured) {
          const directPdf =
            featured.pdfUrl ||
            featured.sections?.[0]?.lectures?.[0]?.resources?.find(
              (r: any) => r.downloadUrl && r.downloadUrl !== '#'
            )?.downloadUrl;

          setClatCourse({
            id: featured.id,
            title: featured.title,
            price: featured.price || 50,
            originalPrice: featured.originalPrice || 999,
            pdfUrl: directPdf,
          });
        }
      } catch (_) {
        const courses = getStoredCourses();
        const featured =
          courses.find((c) => c.showOnHomeScreenPopup === true) ||
          courses.find((c) => c.title.toLowerCase().includes('clat pg') || c.price === 50);
        if (featured) {
          setClatCourse({
            id: featured.id,
            title: featured.title,
            price: featured.price || 50,
            originalPrice: featured.originalPrice || 999,
            pdfUrl: featured.pdfUrl,
          });
        }
      }
    };

    loadPopupCourse();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleClose = () => {
    setIsMinimized(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('msi_clat_mock_popup_dismissed', 'true');
    }
    if (onDismiss) onDismiss();
  };

  const handleOpen = () => {
    setIsMinimized(false);
    setIsVisible(true);
  };

  const handleStartCheckout = () => {
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = (info: RazorpayPaymentSuccessInfo) => {
    const studentPhone =
      typeof window !== 'undefined' ? localStorage.getItem('msi_active_student_phone') || '' : '';
    const studentName =
      typeof window !== 'undefined' ? localStorage.getItem('msi_active_student_name') || 'Student' : 'Student';
    const cleanPhone = studentPhone.replace(/\D/g, '').slice(-10);
    const stuId = cleanPhone ? `msi-stu-${cleanPhone.slice(-4)}` : 'msi-stu-guest';

    enrollStudentAction(
      stuId,
      clatCourse.id,
      'self',
      studentName,
      `CLAT PG Mock Test ₹50 Offer - Txn ${info.razorpayPaymentId}`,
      cleanPhone,
      studentName
    );

    setIsCheckoutOpen(false);
    setIsVisible(false);

    // If PDF is available, open the in-website PDF Viewer Modal right here!
    if (clatCourse.pdfUrl) {
      setViewingPdfUrl(clatCourse.pdfUrl);
      setViewingPdfTitle(clatCourse.title);
      setIsPdfModalOpen(true);
    } else {
      router.push('/student/dashboard');
    }
  };

  if (!isVisible) return null;

  // Minimized Floating Pill Mode
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-bounce-subtle">
        <button
          onClick={handleOpen}
          className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#10233F] via-[#1a365d] to-[#89190E] text-white shadow-2xl border border-[#D4AF37]/60 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <div className="text-left">
            <span className="block text-[10px] font-bold tracking-wider text-[#E8DCCB] uppercase">
              Limited Offer Live
            </span>
            <span className="block text-xs font-serif font-bold text-white">
              CLAT PG Mock Test @ <strong className="text-amber-300">₹50</strong>
            </span>
          </div>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
            Open
          </span>
        </button>
      </div>
    );
  }

  // Expanded Slide-in Luxury Box
  return (
    <>
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2.5rem)] max-w-sm sm:max-w-md animate-slideInRight duration-500">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0E1B2E] via-[#10233F] to-[#0A1422] p-5 sm:p-6 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-[#D4AF37]/50 backdrop-blur-xl">
          {/* Subtle Ambient Decorative Glows */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-36 h-36 rounded-full bg-[#89190E]/30 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-[#D4AF37]/20 blur-2xl" />

          {/* Close / Minimize Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer z-10"
            title="Close offer notification"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top Live Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-extrabold tracking-widest uppercase text-red-400 bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded-full">
              LIVE EXCLUSIVE OFFER
            </span>
            <span className="text-[10px] font-bold text-amber-300 bg-amber-900/40 border border-amber-500/30 px-2 py-0.5 rounded-full">
              95% OFF
            </span>
          </div>

          {/* Main Title & Headline */}
          <div className="pr-6">
            <h3 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
              {clatCourse.title || 'CLAT PG Mock Test 2027'}
            </h3>
            <p className="mt-1 text-xs text-gray-300 leading-relaxed">
              Official entrance mock test series with comprehensive passage-based questions, answer keys, and instant PDF download.
            </p>
          </div>

          {/* Price Highlights Banner */}
          <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                Special Entry Fee
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-serif">
                  ₹{clatCourse.price || 50}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  ₹{clatCourse.originalPrice || 999}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Instant PDF Access</span>
              </span>
            </div>
          </div>

          {/* Value Bullet Points */}
          <div className="mt-3.5 space-y-1.5 text-[11px] text-gray-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Full Length Simulated Mock Test with Answer Key</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Immediate PDF download & attempt inside student portal</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Curated by senior MSI legal faculty & jurists</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex items-center gap-2.5">
            <button
              onClick={handleStartCheckout}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#89190E] via-[#a82417] to-[#89190E] hover:from-[#6d130a] hover:to-[#6d130a] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#89190E]/40 hover:shadow-[#89190E]/60 transition-all cursor-pointer group"
            >
              <span>Enroll & Access PDF @ ₹50</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <Link
              href="/courses"
              className="py-3 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 hover:text-white text-xs font-bold transition-colors text-center shrink-0 border border-white/10"
              title="Explore all courses"
            >
              View More
            </Link>
          </div>

          {/* Bottom Security Assurance */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Secure 256-bit encrypted checkout via Razorpay</span>
          </div>
        </div>
      </div>

      {/* Razorpay Standard Direct Checkout Modal */}
      {isCheckoutOpen && (
        <RazorpayCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          course={{
            id: clatCourse.id,
            title: clatCourse.title,
            price: clatCourse.price || 50,
            originalPrice: clatCourse.originalPrice || 999,
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* In-Website PDF Viewer Modal for Mock Test Attempt */}
      {isPdfModalOpen && (
        <PdfViewerModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          pdfUrl={viewingPdfUrl}
          title={viewingPdfTitle}
          courseTitle="CLAT PG Mock Test Series"
        />
      )}
    </>
  );
}
