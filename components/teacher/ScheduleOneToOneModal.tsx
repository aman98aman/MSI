'use client';

import React, { useState } from 'react';
import { X, Users, Calendar, Video, Clock } from 'lucide-react';
import { OneToOneSession, StudentMonitoringRecord } from './data/teacherMockData';

interface ScheduleOneToOneModalProps {
  students: StudentMonitoringRecord[];
  stream: 'Law' | 'JEE';
  onClose: () => void;
  onSchedule: (session: OneToOneSession) => void;
}

export default function ScheduleOneToOneModal({
  students,
  stream,
  onClose,
  onSchedule,
}: ScheduleOneToOneModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState('Today');
  const [time, setTime] = useState('04:30 PM – 05:00 PM');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const student = students.find((s) => s.id === selectedStudentId);
    const newSession: OneToOneSession = {
      id: `oto-gen-${Date.now()}`,
      studentName: student?.name || 'Selected Student',
      studentRoll: student?.rollNo || '',
      stream,
      topic,
      date,
      time,
      meetLink: `https://meet.google.com/msi-mentor-${Date.now().toString().slice(-6)}`,
      status: 'Scheduled',
    };

    onSchedule(newSession);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#10233F]/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-[#E8DCCB] rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#10233F] text-white px-6 py-4 flex items-center justify-between border-b border-[#EFC988]/30">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#EFC988] uppercase font-bold">
              Student Remedial & Mentorship Lab
            </span>
            <h3 className="font-serif text-base sm:text-lg font-bold text-white tracking-wide">
              Schedule 1-on-1 Academic Doubt Session
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
              Select Enrolled Student *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs font-semibold text-[#10233F] focus:outline-none"
            >
              {students.map((stu) => (
                <option key={stu.id} value={stu.id}>
                  {stu.name} (Roll: {stu.rollNo}) — {stu.batch}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-[#10233F] mb-1">
              Discussion Topic / Doubt Objective *
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Guidance on Anticipatory Bail drafting & ratio analysis"
              className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs sm:text-sm font-semibold text-[#10233F] focus:outline-none focus:border-[#89190E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#10233F] mb-1">
                Day / Date
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs text-[#10233F]"
              />
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#10233F] mb-1">
                Time Slot
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E8DCCB] bg-white text-xs text-[#10233F]"
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#E8DCCB] flex items-center space-x-2 text-[#526174]">
            <Video className="w-4 h-4 text-[#89190E] flex-shrink-0" />
            <span>A private video meeting link will automatically be issued to the student.</span>
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
              Schedule 1-on-1 Meet
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
