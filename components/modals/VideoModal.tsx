'use client';

import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoModal({ isOpen, onClose }: VideoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#10233F]/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-4xl bg-[#10233F] border border-[#EFC988]/30 rounded-3xl overflow-hidden shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-title"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 relative">
              <Image
                src="/images/msi-crest.png"
                alt="MSI Crest"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <span id="video-title" className="text-white font-medium text-sm sm:text-base block">
                MSI Institute Tour & Student Experience
              </span>
              <span className="text-xs text-[#EFC988]">Monga City Centre, Kharar • Mohali</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href="https://youtu.be/6qZ2zcsjidQ"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
            >
              <span>Watch on YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              aria-label="Close video"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Display Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          <iframe
            src="https://www.youtube.com/embed/6qZ2zcsjidQ?autoplay=1&rel=0"
            title="MSI Institute Tour Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white/5 flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>MSI Group of Institutes • Judicial & Legal Education Centre</span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://youtu.be/6qZ2zcsjidQ"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#EFC988] hover:underline font-medium inline-flex items-center space-x-1"
            >
              <span>Open in YouTube</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
