'use client';

import React, { useState } from 'react';
import { X, Calendar, Video, MapPin, Clock, Plus, Link2 } from 'lucide-react';
import { TeacherClassSchedule, TeacherCourse } from './data/teacherMockData';

interface ScheduleClassModalProps {
  courses: TeacherCourse[];
  stream: 'Law' | 'JEE';
  onClose: () => void;
  onSchedule: (newClass: TeacherClassSchedule) => void;
}

export default function ScheduleClassModal({
  courses,
  stream,
  onClose,
  onSchedule,
}: ScheduleClassModalProps) {
  const [subject, setSubject] = useState('');
  const [courseCode, setCourseCode] = useState(courses[0]?.code || '');
  const [time, setTime] = useState('10:00 AM – 11:30 AM');
  const [day, setDay] = useState('Tomorrow');
  const [venue, setVenue] = useState('Lecture Hall 3A (Smart Wing)');
  const [type, setType] = useState<'Theory Lecture' | 'Practical / Moot' | 'Tutorial'>('Theory Lecture');
  const [generateMeet, setGenerateMeet] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    const matchedCourse = courses.find((c) => c.code === courseCode);
    const newClass: TeacherClassSchedule = {
      id: `sch-gen-${Date.now()}`,
      subject,
      courseCode,
      stream,
      batch: matchedCourse?.batch || 'Active Batch',
      time,
      day,
      venue,
      meetLink: generateMeet ? `https://meet.google.com/msi-${Date.now().toString().slice(-6)}` : undefined,
      type,
      isLiveNow: false,
    };

    onSchedule(newClass);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#10233F]/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-[#E8DCCB] rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#10233F] text-white px-6 py-4 flex items-center justify-between border-b border-[#EFC988]/30">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#EFC988] uppercase font-bold">
              Class & Timetable Scheduler • {stream}
            </span>
            <h3 className="font-serif text-base sm:text-lg font-bold text-white tracking-wide">
              Schedule New Lecture or Moot Session
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#FFF9EF]/40 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#10233F] mb-1">
              Lecture Title / Topic *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Criminal Evidence: Dying Declarations & Case Precedents"
              className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs sm:text-sm font-semibold text-[#10233F] focus:outline-none focus:border-[#89190E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#10233F] mb-1">
                Course Mapping
              </label>
              <select
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs font-semibold text-[#10233F] focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.batch})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[#10233F] mb-1">
                Session Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs font-semibold text-[#10233F] focus:outline-none"
              >
                <option value="Theory Lecture">Theory Lecture</option>
                <option value="Practical / Moot">Practical / Moot Court</option>
                <option value="Tutorial">Tutorial / Case Digest</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#10233F] mb-1">
                Date / Day
              </label>
              <input
                type="text"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                placeholder="e.g. Today or Tomorrow or Monday"
                className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs text-[#10233F]"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[#10233F] mb-1">
                Time Duration
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 11:30 AM – 01:00 PM"
                className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs text-[#10233F]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-[#10233F] mb-1">
              Institute Hall / Laboratory Venue
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs text-[#10233F]"
            />
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#E8DCCB] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Video className="w-4 h-4 text-[#89190E]" />
              <span className="font-semibold text-[#10233F]">
                Auto-Generate Live Video Conference Link
              </span>
            </div>
            <input
              type="checkbox"
              checked={generateMeet}
              onChange={(e) => setGenerateMeet(e.target.checked)}
              className="rounded border-[#E8DCCB] text-[#89190E] focus:ring-[#89190E]"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E8DCCB] font-semibold text-[#526174] hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#89190E] hover:bg-[#65130D] text-white font-bold transition-all shadow-md shadow-[#89190E]/20"
            >
              Schedule Session
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
