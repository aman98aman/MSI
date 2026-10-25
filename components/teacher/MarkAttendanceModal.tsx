'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, Clock, Save, UserCheck, ShieldCheck } from 'lucide-react';
import { StudentMonitoringRecord, TeacherClassSchedule } from './data/teacherMockData';

interface MarkAttendanceModalProps {
  session: TeacherClassSchedule | null;
  students: StudentMonitoringRecord[];
  onClose: () => void;
  onSave: (sessionId: string, attendanceMap: Record<string, 'Present' | 'Absent' | 'Late'>) => void;
}

export default function MarkAttendanceModal({
  session,
  students,
  onClose,
  onSave,
}: MarkAttendanceModalProps) {
  // Initialize attendance with default 'Present'
  const [attendance, setAttendance] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>(
    () => {
      const initial: Record<string, 'Present' | 'Absent' | 'Late'> = {};
      students.forEach((s) => {
        initial[s.id] = 'Present';
      });
      return initial;
    }
  );

  if (!session) return null;

  const setStatus = (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAll = (status: 'Present' | 'Absent') => {
    const updated: Record<string, 'Present' | 'Absent' | 'Late'> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendance(updated);
  };

  const presentCount = Object.values(attendance).filter((v) => v === 'Present').length;
  const absentCount = Object.values(attendance).filter((v) => v === 'Absent').length;
  const lateCount = Object.values(attendance).filter((v) => v === 'Late').length;

  const handleSave = () => {
    onSave(session.id, attendance);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#10233F]/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-[#E8DCCB] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#10233F] text-white px-6 py-4 flex items-center justify-between border-b border-[#EFC988]/30">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-mono tracking-widest text-[#EFC988] uppercase font-bold">
                Electronic Class Register • {session.batch}
              </span>
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-white tracking-wide truncate max-w-md">
              {session.subject}
            </h3>
            <p className="text-xs text-white/70">
              {session.time} • Venue: {session.venue}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Bulk Actions Bar */}
        <div className="bg-[#FFF9EF] px-6 py-3 border-b border-[#E8DCCB] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-[#10233F]">
              Total: {students.length} Enrolled
            </span>
            <span className="text-emerald-700 font-semibold">● Present: {presentCount}</span>
            <span className="text-rose-700 font-semibold">● Absent: {absentCount}</span>
            <span className="text-amber-700 font-semibold">● Late: {lateCount}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => markAll('Present')}
              className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-[11px] font-bold"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markAll('Absent')}
              className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-800 hover:bg-rose-50 text-[11px] font-bold"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Student List Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-[#E8DCCB]/60">
          {students.map((stu) => {
            const status = attendance[stu.id] || 'Present';
            return (
              <div
                key={stu.id}
                className="py-3 flex items-center justify-between gap-4 hover:bg-[#FFF9EF]/40 px-2 rounded-xl transition-colors"
              >
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#10233F]">
                    {stu.name}
                  </h4>
                  <p className="text-xs text-[#526174]">
                    Roll: <span className="font-mono font-semibold">{stu.rollNo}</span> • Term Attendance: {stu.attendancePercentage}%
                  </p>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setStatus(stu.id, 'Present')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      status === 'Present'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-[#E8DCCB] text-[#526174] hover:bg-emerald-50'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(stu.id, 'Absent')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      status === 'Absent'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white border border-[#E8DCCB] text-[#526174] hover:bg-rose-50'
                    }`}
                  >
                    Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(stu.id, 'Late')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      status === 'Late'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white border border-[#E8DCCB] text-[#526174] hover:bg-amber-50'
                    }`}
                  >
                    Late
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E8DCCB] flex items-center justify-between">
          <span className="text-[11px] text-[#526174]">
            Synced with Bar Council mandatory compliance tracker.
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E8DCCB] text-xs font-semibold text-[#526174] hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#89190E] hover:bg-[#65130D] text-white text-xs font-bold transition-all shadow-md shadow-[#89190E]/20 flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Submit Daily Register</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
