'use client';

import React, { useState } from 'react';
import { X, Play, Pause, Volume2, Maximize2, Download, BookOpen, CheckCircle, FileText } from 'lucide-react';
import { RecordedVideo } from './data/studentMockData';

interface VideoPlayerModalProps {
  video: RecordedVideo | null;
  onClose: () => void;
}

export default function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'topics' | 'notes'>('topics');

  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#10233F]/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-white border border-[#E8DCCB] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-[#10233F] text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-[#EFC988]/30 gap-2">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EFC988] animate-pulse-beacon flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-mono tracking-wider text-[#EFC988] uppercase font-bold truncate block">
                MSI Digital Player • {video.subject}
              </span>
              <h3 className="font-serif text-sm sm:text-lg font-bold text-white tracking-wide truncate max-w-lg">
                {video.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Close Video Player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Video + Sidebar */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 bg-[#FFF9EF]/40">
          
          {/* Main Video Viewport */}
          <div className="lg:col-span-2 p-4 sm:p-6 flex flex-col justify-between">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-neutral-800 flex items-center justify-center group">
              {video.videoUrl ? (
                <video
                  src={video.videoUrl}
                  controls
                  poster={video.thumbnail}
                  className="w-full h-full object-contain"
                  autoPlay={false}
                />
              ) : (
                <div className="text-center p-6 text-white/70">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                    <Play className="w-8 h-8 text-[#EFC988]" />
                  </div>
                  <p className="font-medium text-sm text-white">Stream Unavailable Offline</p>
                  <p className="text-xs text-white/50 mt-1">Please connect to institute network</p>
                </div>
              )}
            </div>

            {/* Video Meta Information */}
            <div className="mt-4 p-4 rounded-2xl bg-white border border-[#E8DCCB]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-[#89190E] uppercase tracking-wider">
                    Senior Faculty Lecture
                  </span>
                  <h4 className="font-serif font-bold text-base sm:text-lg text-[#10233F] mt-0.5">
                    {video.faculty}
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-[#FFF3DD] text-[#89190E] px-3 py-1 rounded-full font-bold">
                    Duration: {video.duration}
                  </span>
                  <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full font-bold border border-emerald-200">
                    Uploaded {video.uploadDate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Topics & Lecture Notes Sidebar */}
          <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-[#E8DCCB] bg-white p-5 flex flex-col justify-between">
            <div>
              {/* Tab Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#FFF9EF] rounded-xl border border-[#E8DCCB] mb-4">
                <button
                  onClick={() => setActiveTab('topics')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'topics'
                      ? 'bg-[#10233F] text-white shadow-sm'
                      : 'text-[#526174] hover:text-[#10233F]'
                  }`}
                >
                  Key Concepts
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'notes'
                      ? 'bg-[#10233F] text-white shadow-sm'
                      : 'text-[#526174] hover:text-[#10233F]'
                  }`}
                >
                  Lecture Handout
                </button>
              </div>

              {/* Topics Tab */}
              {activeTab === 'topics' ? (
                <div className="space-y-3">
                  <h5 className="text-xs font-serif font-bold uppercase tracking-wider text-[#10233F]">
                    Syllabus Coverage ({video.topics.length})
                  </h5>
                  <div className="space-y-2">
                    {video.topics.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#FFF9EF]/80 border border-[#E8DCCB] flex items-start space-x-2.5"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-xs font-medium text-[#10233F] leading-snug">{t}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-[#FFF3DD] border border-[#EFC988]/60 text-xs text-[#89190E]">
                    <strong>Exam Tip:</strong> High Court judges frequently frame 10-mark questions on these specific topics.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h5 className="text-xs font-serif font-bold uppercase tracking-wider text-[#10233F]">
                    Accompanying Materials
                  </h5>
                  <div className="p-3.5 rounded-xl border border-[#E8DCCB] bg-[#FFF9EF]/50">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-[#89190E]" />
                      <div>
                        <p className="text-xs font-bold text-[#10233F]">Faculty Lecture Summary.pdf</p>
                        <p className="text-[10px] text-[#526174]">28 Pages • Annotated by Faculty</p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert('Downloading official annotated lecture digest PDF...')}
                      className="mt-3 w-full py-1.5 rounded-lg bg-[#89190E] hover:bg-[#65130D] text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF Digest</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Entitlement note */}
            <div className="pt-4 border-t border-[#E8DCCB] text-[11px] text-[#526174]">
              <span className="font-semibold text-[#10233F]">MSI Watermark Protection:</span> Live DRM active. Session tied to your Enrollment ID.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
