'use client';

import React, { useState } from 'react';
import { X, Award, Plus, CheckCircle2, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { AssessmentItem, TeacherCourse } from './data/teacherMockData';

interface CreateTestModalProps {
  courses: TeacherCourse[];
  stream: 'Law' | 'JEE';
  onClose: () => void;
  onCreate: (newAssessment: AssessmentItem) => void;
}

export default function CreateTestModal({
  courses,
  stream,
  onClose,
  onCreate,
}: CreateTestModalProps) {
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState(courses[0]?.code || '');
  const [type, setType] = useState<'Mock' | 'Formal'>('Mock');
  const [totalQuestions, setTotalQuestions] = useState(25);
  const [marks, setMarks] = useState(100);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [negativeMarking, setNegativeMarking] = useState('+4 / -1 Mark Penalty');
  const [scheduledDate, setScheduledDate] = useState('Immediate / Live');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newAssessment: AssessmentItem = {
      id: `asmt-gen-${Date.now()}`,
      title,
      courseCode,
      stream,
      type,
      totalQuestions: Number(totalQuestions),
      marks: Number(marks),
      durationMinutes: Number(durationMinutes),
      negativeMarking,
      scheduledDate,
      status: 'Published',
      submissionsCount: 0,
    };

    onCreate(newAssessment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#10233F]/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white border border-[#E8DCCB] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#10233F] text-white px-6 py-4 flex items-center justify-between border-b border-[#EFC988]/30">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EFC988] animate-pulse-beacon" />
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#EFC988] uppercase font-bold">
                Faculty Assessment Engine • {stream} Stream
              </span>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white tracking-wide">
                Configure New Examination or Mock Test
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 bg-[#FFF9EF]/40 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#10233F] mb-1">
              Assessment Title / Exam Header *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. PCS-J High-Yield Speed Drill #13 (Indian Evidence Act)"
              className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs sm:text-sm font-semibold text-[#10233F] focus:outline-none focus:border-[#89190E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#10233F] mb-1">
                Target Course / Batch
              </label>
              <select
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs font-semibold text-[#10233F] focus:outline-none focus:border-[#89190E]"
              >
                {courses.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.batch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[#10233F] mb-1">
                Evaluation Format
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'Mock' | 'Formal')}
                className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs font-semibold text-[#10233F] focus:outline-none focus:border-[#89190E]"
              >
                <option value="Mock">Mock Test (Diagnostic)</option>
                <option value="Formal">Formal Examination (Term Evaluation)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#10233F] mb-1">
                Questions
              </label>
              <input
                type="number"
                min={5}
                max={150}
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs font-mono font-bold text-[#10233F]"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[#10233F] mb-1">
                Max Marks
              </label>
              <input
                type="number"
                min={10}
                max={500}
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs font-mono font-bold text-[#89190E]"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[#10233F] mb-1">
                Duration (Mins)
              </label>
              <input
                type="number"
                min={5}
                max={240}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs font-mono font-bold text-[#10233F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#10233F] mb-1">
                Negative Marking Scheme
              </label>
              <select
                value={negativeMarking}
                onChange={(e) => setNegativeMarking(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs font-medium text-[#10233F]"
              >
                <option value="+4 / -1 Mark Penalty">+4 Correct / -1 Negative (Judiciary/Entrance)</option>
                <option value="+1 / -0.25 Mark Penalty">+1 Correct / -0.25 Negative</option>
                <option value="No Negative Marking">No Negative Marking (Subjective)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[#10233F] mb-1">
                Scheduled Availability
              </label>
              <input
                type="text"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                placeholder="e.g. Immediate / Live or 25 Sep 2025"
                className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs font-medium text-[#10233F]"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FFF3DD] border border-[#EFC988] text-[11px] text-[#89190E]">
            <strong>Automatic Portal Sync:</strong> Publishing this assessment immediately dispatches it to enrolled students in this course with real-time countdown clocks.
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E8DCCB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E8DCCB] font-semibold text-[#526174] hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#89190E] hover:bg-[#65130D] text-white font-bold transition-all shadow-md shadow-[#89190E]/20 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Assessment</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
