'use client';

import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import { AssignmentItem } from './data/studentMockData';

interface SubmitAssignmentModalProps {
  assignment: AssignmentItem | null;
  onClose: () => void;
  onSubmitSuccess: (assignmentId: string, filename: string) => void;
}

export default function SubmitAssignmentModal({
  assignment,
  onClose,
  onSubmitSuccess,
}: SubmitAssignmentModalProps) {
  const [fileName, setFileName] = useState('My_Research_Draft_V1.pdf');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!assignment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitSuccess(assignment.id, fileName);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#10233F]/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-[#E8DCCB] rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#10233F] text-white px-6 py-4 flex items-center justify-between border-b border-[#EFC988]/30">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#EFC988] uppercase font-bold">
              Student Assignment Portal
            </span>
            <h3 className="font-serif text-base sm:text-lg font-bold text-white tracking-wide truncate max-w-sm">
              {assignment.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#FFF9EF]/40">
          <div className="p-3.5 rounded-2xl bg-white border border-[#E8DCCB] text-xs">
            <p className="text-[#526174]">
              <strong>Subject:</strong> {assignment.subject}
            </p>
            <p className="text-[#526174] mt-1">
              <strong>Due Date:</strong> <span className="text-[#89190E] font-bold">{assignment.dueDate}</span>
            </p>
            <p className="text-[#526174] mt-1">
              <strong>Maximum Evaluation:</strong> {assignment.maxMarks} Marks
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#10233F] mb-1.5">
              Upload PDF or Docx Draft
            </label>
            <div className="border-2 border-dashed border-[#E8DCCB] hover:border-[#89190E] rounded-2xl p-6 text-center bg-white cursor-pointer transition-colors">
              <UploadCloud className="w-8 h-8 text-[#89190E] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#10233F]">Click to browse or drop file here</p>
              <p className="text-[10px] text-[#526174] mt-1">Accepts PDF, DOCX up to 25 MB</p>
              <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-[#FFF3DD] text-[#89190E] text-xs font-mono font-bold">
                <FileText className="w-3.5 h-3.5" />
                <span>{fileName}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#10233F] mb-1.5">
              Student Note / Case Law Citations (Optional)
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="E.g., Added latest 2024 Supreme Court Constitution Bench citations in paragraph 4..."
              className="w-full p-3 rounded-xl border border-[#E8DCCB] bg-white text-xs text-[#10233F] focus:outline-none focus:border-[#89190E]"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E8DCCB] text-xs font-semibold text-[#526174] hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#89190E] hover:bg-[#65130D] text-white text-xs font-bold transition-all shadow-md shadow-[#89190E]/20"
            >
              {isSubmitting ? 'Uploading to Evaluation Cell...' : 'Submit Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
