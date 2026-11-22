'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  BookOpen,
  Calendar,
  Eye,
  X,
  AlertTriangle,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import GlassCard from '../glass/GlassCard';

interface LMSNote {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  pdfPath: string;
  pdfOriginalName: string;
  isPublished: boolean;
  uploadedBy: string;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
}

interface StudentNotesTabProps {
  studentPhone: string;
  enrolledCourseIds: string[];
}

export default function StudentNotesTab({
  studentPhone,
  enrolledCourseIds,
}: StudentNotesTabProps) {
  const [notes, setNotes] = useState<LMSNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<LMSNote | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/lms/notes', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch notes');
        const data = await res.json();
        if (data.success && Array.isArray(data.notes)) {
          // Filter: only published notes for enrolled courses
          const filtered = data.notes.filter(
            (n: LMSNote) =>
              n.isPublished &&
              (enrolledCourseIds.length === 0 ||
                enrolledCourseIds.includes(n.courseId))
          );
          setNotes(filtered);
        }
      } catch (err: any) {
        setError(err.message || 'Could not load notes');
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [enrolledCourseIds.join(',')]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0E1A2E] via-[#162D50] to-[#0E3D2E] text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold">
                Faculty Learning Resources
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
              Notes &amp; Study Materials
            </h2>
            <p className="text-white/70 text-xs sm:text-sm mt-1.5">
              Access PDF notes and materials uploaded by your faculty for enrolled courses.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
            <FileText className="w-5 h-5 text-emerald-300" />
            <div>
              <p className="text-xs text-white/60 font-mono">Available Materials</p>
              <p className="text-xl font-bold font-mono text-white">{notes.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="ml-3 text-sm text-slate-500">Loading notes…</span>
        </div>
      ) : error ? (
        <GlassCard variant="elevated" className="p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
        </GlassCard>
      ) : notes.length === 0 ? (
        <GlassCard variant="elevated" className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white mb-2">
            No notes available yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Your faculty hasn&apos;t uploaded any notes for your enrolled courses yet. Check back
            later.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {notes.map((note) => (
            <GlassCard
              key={note.id}
              variant="interactive"
              className="p-6 flex flex-col justify-between gap-4"
            >
              <div>
                {/* Top: Course Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 uppercase tracking-wider">
                    {note.courseName}
                  </span>
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>

                {/* Title & Description */}
                <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {note.title}
                </h3>
                {note.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                    {note.description}
                  </p>
                )}

                {/* Meta Info */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>By {note.uploadedBy}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Uploaded {formatDate(note.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => setViewingNote(note)}
                className="w-full mt-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-90 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                View Notes
              </button>
            </GlassCard>
          ))}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md animate-fadeIn">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#0E1A2E] border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white/50 font-mono uppercase tracking-wider">
                  {viewingNote.courseName}
                </p>
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {viewingNote.title}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setViewingNote(null)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0 ml-4 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* PDF Iframe */}
          <div
            className="flex-1 relative overflow-hidden"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            <div
              className="absolute inset-0"
              style={{ pointerEvents: 'all' }}
            >
              <iframe
                src={`/api/lms/pdf-access?noteId=${viewingNote.id}&studentPhone=${encodeURIComponent(studentPhone)}`}
                className="w-full h-full border-0"
                style={{
                  height: 'calc(100vh - 120px)',
                  userSelect: 'none',
                }}
                title={viewingNote.title}
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>

          {/* Warning Footer */}
          <div className="flex-shrink-0 px-4 py-2.5 bg-amber-950/60 border-t border-amber-800/30 text-center">
            <p className="text-[10px] text-amber-400 font-medium flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              This material is for enrolled students only. Downloading or sharing is prohibited.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
