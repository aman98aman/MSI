'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Upload,
  ExternalLink,
  BookOpen,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { MSICourse } from '@/lib/lmsStore';
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

interface TeacherNotesTabProps {
  lmsCourses: MSICourse[];
  teacherId: string;
  teacherName: string;
}

export default function TeacherNotesTab({
  lmsCourses,
  teacherId,
  teacherName,
}: TeacherNotesTabProps) {
  const [notes, setNotes] = useState<LMSNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'saving' | 'done' | 'error'>('idle');
  const [uploadStatusText, setUploadStatusText] = useState('Uploading PDF...');
  const [uploadError, setUploadError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Modal form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    courseId: '',
    courseName: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lms/notes?teacherId=${encodeURIComponent(teacherId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.notes)) {
          setNotes(data.notes);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teacherId) fetchNotes();
  }, [teacherId]);

  const handleCourseChange = (courseId: string) => {
    const course = lmsCourses.find((c) => c.id === courseId);
    setForm((prev) => ({
      ...prev,
      courseId,
      courseName: course?.title || '',
    }));
  };

  const handleUploadNotes = async () => {
    if (!form.title.trim()) { setUploadError('Title is required.'); return; }
    if (!form.courseId) { setUploadError('Please select a course.'); return; }
    if (!selectedFile) { setUploadError('Please select a PDF file.'); return; }

    setUploadError('');
    setUploadProgress('uploading');
    setUploadStatusText('Preparing PDF upload...');

    try {
      // Step 1: Upload PDF (with client-side chunking for large files)
      const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB per chunk to stay well below Vercel's 4.5MB limit
      const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);
      const uploadId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      let uploadData: any = null;

      if (totalChunks <= 1) {
        setUploadStatusText('Uploading PDF document...');
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('fileName', selectedFile.name);
        formData.append('teacherId', teacherId);
        formData.append('courseId', form.courseId);

        const uploadRes = await fetch('/api/lms/upload-pdf', {
          method: 'POST',
          body: formData,
        });

        const data = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok || !data.success) {
          throw new Error(data.message || data.error || `PDF upload failed (Server status ${uploadRes.status})`);
        }
        uploadData = data;
      } else {
        // Chunked upload for large files (e.g. 10MB+)
        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, selectedFile.size);
          const chunkBlob = selectedFile.slice(start, end, 'application/pdf');
          const percent = Math.round(((i + 1) / totalChunks) * 100);

          setUploadStatusText(`Uploading: ${percent}% (Chunk ${i + 1}/${totalChunks})...`);

          const formData = new FormData();
          formData.append('file', chunkBlob, selectedFile.name);
          formData.append('uploadId', uploadId);
          formData.append('chunkIndex', String(i));
          formData.append('totalChunks', String(totalChunks));
          formData.append('fileName', selectedFile.name);
          formData.append('teacherId', teacherId);
          formData.append('courseId', form.courseId);

          const uploadRes = await fetch('/api/lms/upload-pdf', {
            method: 'POST',
            body: formData,
          });

          const data = await uploadRes.json().catch(() => ({}));
          if (!uploadRes.ok || !data.success) {
            throw new Error(data.message || data.error || `Upload failed on chunk ${i + 1} of ${totalChunks} (Status ${uploadRes.status})`);
          }

          if (data.done) {
            uploadData = data;
          }
        }
      }

      if (!uploadData || !uploadData.pdfPath) {
        throw new Error('Failed to obtain uploaded PDF path from server.');
      }

      // Step 2: Save note metadata
      setUploadProgress('saving');
      setUploadStatusText('Saving course notes to database...');
      const noteRes = await fetch('/api/lms/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          courseId: form.courseId,
          courseName: form.courseName,
          pdfPath: uploadData.pdfPath,
          pdfOriginalName: uploadData.pdfOriginalName || selectedFile.name,
          gridFsFileId: uploadData.gridFsFileId,
          isPublished: false,
          uploadedBy: teacherName,
          uploadedById: teacherId,
        }),
      });

      const noteData = await noteRes.json().catch(() => ({}));
      if (!noteRes.ok || !noteData.success) {
        throw new Error(noteData.message || noteData.error || `Failed to save note record (Status ${noteRes.status})`);
      }

      setUploadProgress('done');
      setUploadStatusText('Upload complete!');
      await fetchNotes();

      setTimeout(() => {
        setIsModalOpen(false);
        resetModal();
      }, 1200);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
      setUploadProgress('error');
    }
  };

  const resetModal = () => {
    setForm({ title: '', description: '', courseId: '', courseName: '' });
    setSelectedFile(null);
    setUploadProgress('idle');
    setUploadStatusText('Uploading PDF...');
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTogglePublish = async (note: LMSNote) => {
    setTogglingId(note.id);
    try {
      const res = await fetch('/api/lms/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: note.id, isPublished: !note.isPublished }),
      });
      if (res.ok) {
        setNotes((prev) =>
          prev.map((n) => (n.id === note.id ? { ...n, isPublished: !n.isPublished } : n))
        );
      }
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      const res = await fetch(`/api/lms/notes?id=${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleViewNote = (note: LMSNote) => {
    window.open(`/api/lms/pdf-access?noteId=${note.id}&role=faculty`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <GlassCard variant="elevated" className="p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-200/50 dark:border-white/10">
          <div>
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-[#89190E] dark:text-[#EFC988]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Notes Management
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload, publish, and manage PDF notes for your enrolled students.
            </p>
          </div>

          <button
            onClick={() => { resetModal(); setIsModalOpen(true); }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#89190E] to-[#B22222] text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-[#89190E]/20 transition-all cursor-pointer hover:opacity-95"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Notes</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 mt-4 text-xs text-gray-500 dark:text-gray-400">
          <span>Total: <strong className="text-gray-900 dark:text-white">{notes.length}</strong></span>
          <span>Published: <strong className="text-emerald-600 dark:text-emerald-400">{notes.filter(n => n.isPublished).length}</strong></span>
          <span>Drafts: <strong className="text-gray-700 dark:text-gray-300">{notes.filter(n => !n.isPublished).length}</strong></span>
        </div>
      </GlassCard>

      {/* Notes Table */}
      <GlassCard variant="elevated" className="p-6 sm:p-7">
        <h3 className="font-serif text-base sm:text-lg font-bold text-gray-900 dark:text-white pb-4 border-b border-gray-200/50 dark:border-white/10">
          Uploaded Notes ({notes.length})
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#89190E] dark:text-[#EFC988] animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-14 h-14 text-gray-300 dark:text-gray-600 mb-4" />
            <h4 className="font-serif text-base font-bold text-gray-700 dark:text-gray-300">No Notes Uploaded Yet</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
              Click "Upload Notes" to add your first PDF note for students.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/60 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-b border-gray-200/50 dark:border-white/10">
                <tr>
                  <th className="p-3 font-serif font-bold">Title</th>
                  <th className="p-3 font-serif font-bold">Course</th>
                  <th className="p-3 font-serif font-bold">Date</th>
                  <th className="p-3 font-serif font-bold">Status</th>
                  <th className="p-3 font-serif font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/40 dark:divide-white/10">
                {notes.map((note) => (
                  <tr key={note.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3">
                      <div className="flex items-start space-x-2">
                        <div className="p-1.5 rounded-lg bg-[#89190E]/10 dark:bg-white/10 text-[#89190E] dark:text-[#EFC988] flex-shrink-0 mt-0.5">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-sm text-gray-900 dark:text-white">{note.title}</h4>
                          {note.description && (
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{note.description}</p>
                          )}
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{note.pdfOriginalName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#89190E]/10 dark:bg-[#89190E]/20 text-[#89190E] dark:text-[#EFC988]">
                        {note.courseName || note.courseId}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 dark:text-gray-400 font-medium">
                      {new Date(note.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        note.isPublished
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-gray-200/60 dark:bg-white/10 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-white/10'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${note.isPublished ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        <span>{note.isPublished ? 'Published' : 'Draft'}</span>
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View */}
                        <button
                          onClick={() => handleViewNote(note)}
                          title="View PDF"
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        {/* Toggle Publish */}
                        <button
                          onClick={() => handleTogglePublish(note)}
                          disabled={togglingId === note.id}
                          title={note.isPublished ? 'Unpublish' : 'Publish'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            note.isPublished
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                          }`}
                        >
                          {togglingId === note.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : note.isPublished
                            ? <Eye className="w-3.5 h-3.5" />
                            : <EyeOff className="w-3.5 h-3.5" />
                          }
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => setDeleteConfirmId(note.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#121A2B] rounded-3xl shadow-2xl border border-gray-200/60 dark:border-white/10 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-[#89190E] dark:text-[#EFC988]" />
                <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">Upload Notes</h3>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); resetModal(); }}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Notes Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Constitutional Law - Chapter 3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#89190E]/30 dark:focus:ring-[#EFC988]/30"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of the notes content..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#89190E]/30 dark:focus:ring-[#EFC988]/30 resize-none"
                />
              </div>

              {/* Course Select */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Select Course <span className="text-red-500">*</span>
                </label>
                {lmsCourses.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-700 dark:text-amber-300 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>No courses assigned. Please contact the admin.</span>
                  </div>
                ) : (
                  <select
                    value={form.courseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#89190E]/30 dark:focus:ring-[#EFC988]/30"
                  >
                    <option value="">— Select a course —</option>
                    {lmsCourses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* PDF Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  PDF File <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-[#89190E] dark:hover:border-[#EFC988] bg-gray-50 dark:bg-white/5 cursor-pointer transition-colors text-center"
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-700 dark:text-gray-200">
                      <FileText className="w-5 h-5 text-[#89190E] dark:text-[#EFC988]" />
                      <span className="font-semibold truncate max-w-xs">{selectedFile.name}</span>
                      <span className="text-xs text-gray-400">({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                    </div>
                  ) : (
                    <div className="text-gray-400 dark:text-gray-500">
                      <Upload className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-xs">Click to select PDF (max 50MB)</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && file.size > 50 * 1024 * 1024) {
                      setUploadError('File exceeds 50MB limit.');
                      return;
                    }
                    setSelectedFile(file);
                    setUploadError('');
                  }}
                />
              </div>

              {/* Error */}
              {uploadError && (
                <div className="flex items-center space-x-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Success */}
              {uploadProgress === 'done' && (
                <div className="flex items-center space-x-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Notes uploaded successfully!</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 pt-0 flex items-center justify-end gap-3">
              <button
                onClick={() => { setIsModalOpen(false); resetModal(); }}
                className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadNotes}
                disabled={uploadProgress === 'uploading' || uploadProgress === 'saving' || uploadProgress === 'done'}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#89190E] to-[#B22222] text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {(uploadProgress === 'uploading' || uploadProgress === 'saving') && (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{uploadStatusText}</span>
                  </>
                )}
                {uploadProgress === 'done' && <><CheckCircle2 className="w-3.5 h-3.5" /><span>Uploaded!</span></>}
                {(uploadProgress === 'idle' || uploadProgress === 'error') && <><Upload className="w-3.5 h-3.5" /><span>Upload Notes</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#121A2B] rounded-3xl shadow-2xl border border-gray-200/60 dark:border-white/10 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Note?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              This will permanently delete the note and its PDF. Students will lose access. This cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold hover:opacity-95 transition-all cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
