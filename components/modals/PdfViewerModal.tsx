'use client';

import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
  courseTitle?: string;
}

export default function PdfViewerModal({
  isOpen,
  onClose,
  pdfUrl,
  title,
  courseTitle,
}: PdfViewerModalProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!isOpen || !pdfUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full bg-[#0E1B2E] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#D4AF37]/50 flex flex-col overflow-hidden transition-all duration-300 ${
          isFullScreen ? 'h-[98vh] max-w-[98vw]' : 'h-[92vh] max-w-5xl'
        }`}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#10233F] via-[#1A365D] to-[#89190E] text-white px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-[#D4AF37]/30 shadow-sm shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center border border-white/20 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                {courseTitle || 'Official MSI Academic Document'}
              </span>
              <h3 className="font-serif text-sm sm:text-base font-bold text-white truncate">
                {title || 'Mock Test Question Paper & Solutions'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download Button */}
            <a
              href={pdfUrl}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors border border-white/15"
              title="Download PDF Copy"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer hidden sm:flex items-center justify-center"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/15 hover:bg-red-600 text-white transition-colors cursor-pointer"
              title="Close PDF Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security Notification Bar */}
        <div className="bg-[#FFF9EF] border-b border-[#E8DCCB] px-4 py-1.5 flex items-center justify-between text-[11px] text-[#10233F] shrink-0">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              <strong>Verified MSI Curriculum Asset:</strong> Official Mock Test PDF for Enrolled Students
            </span>
          </div>
          <span className="text-[10px] text-gray-500 hidden sm:inline">
            Use tools below to zoom, navigate pages, and attempt test questions
          </span>
        </div>

        {/* PDF Frame */}
        <div className="flex-1 w-full bg-gray-100 relative overflow-hidden">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1`}
            className="w-full h-full border-none"
            title={title || 'Mock Test PDF Viewer'}
          />
        </div>
      </div>
    </div>
  );
}
