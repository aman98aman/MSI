'use client';

import React, { useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Filter,
  ShieldCheck,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  AttendanceSubject,
  AttendanceLogEntry,
  StudentProfile,
} from './data/studentMockData';

interface StudentAttendanceTabProps {
  student: StudentProfile;
  subjects: AttendanceSubject[];
  logs: AttendanceLogEntry[];
}

export default function StudentAttendanceTab({
  student,
  subjects,
  logs,
}: StudentAttendanceTabProps) {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Overall attendance calculation
  const totalClasses = subjects.reduce((acc, s) => acc + s.total, 0);
  const totalAttended = subjects.reduce((acc, s) => acc + s.attended, 0);
  const overallPercentage = Math.round((totalAttended / (totalClasses || 1)) * 1000) / 10;

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (selectedSubjectFilter !== 'all' && !log.subject.includes(selectedSubjectFilter)) {
      return false;
    }
    if (selectedStatusFilter !== 'all' && log.status !== selectedStatusFilter) {
      return false;
    }
    return true;
  });

  // Calculate classes that can be missed or need to be attended
  // Formula for 75%: (attended) / (total + x) >= 0.75 => attended >= 0.75*(total+x) => 0.75*x <= attended - 0.75*total => x <= (attended - 0.75*total)/0.75
  const bufferClasses = Math.max(0, Math.floor((totalAttended - 0.75 * totalClasses) / 0.75));

  return (
    <div className="space-y-6">
      {/* 1. Top Summary Banner with Attendance Ring & Bar Council Compliance */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-[#10233F] via-[#162d50] to-[#89190E] text-white shadow-xl hud-bracket relative overflow-hidden">
        <div className="absolute inset-0 blueprint-grid opacity-15 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="max-w-xl">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#EFC988]" />
              <span className="text-[10px] sm:text-xs font-mono tracking-widest text-[#EFC988] uppercase font-bold">
                Bar Council of India & UGC NAAC Attendance Compliance
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1.5">
              Attendance Health & Academic Regularity
            </h2>
            <p className="text-white/80 text-xs sm:text-sm mt-2 leading-relaxed">
              Your overall attendance is{' '}
              <strong className="text-[#EFC988] font-bold">{overallPercentage}%</strong> ({totalAttended} of {totalClasses} scheduled lectures attended). You comfortably exceed the statutory 75% examination eligibility threshold.
            </p>

            <div className="mt-4 inline-flex items-center space-x-2 p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                <strong>Safe Margin:</strong> You can safely miss up to <strong>{bufferClasses} more lectures</strong> without falling below 75%.
              </span>
            </div>
          </div>

          {/* Large Circular Metric Display */}
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-white/10 backdrop-blur-md border-4 border-[#EFC988] flex flex-col items-center justify-center shadow-2xl">
              <span className="text-[10px] font-mono tracking-wider uppercase text-[#EFC988] font-bold">
                Overall
              </span>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-white leading-none mt-1">
                {overallPercentage}%
              </span>
              <span className="text-[10px] font-bold text-emerald-300 mt-1">
                Eligible for Exams
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Course / Subject-wise Attendance Grid */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8DCCB] shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DCCB]">
          <div>
            <div className="flex items-center space-x-2">
              <CalendarCheck className="w-5 h-5 text-[#89190E]" />
              <h3 className="font-serif text-lg font-bold text-[#10233F]">
                Course & Subject-Wise Attendance Breakdown
              </h3>
            </div>
            <p className="text-xs text-[#526174] mt-0.5">
              Subject-wise threshold monitored for continuous internal evaluation (CIE).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
          {subjects.map((subj) => {
            const isSafe = subj.percentage >= 75;
            return (
              <div
                key={subj.code}
                className="p-5 rounded-2xl border border-[#E8DCCB] hover:border-[#89190E] transition-all bg-[#FFF9EF]/40 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#10233F] text-white">
                      {subj.code}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                        isSafe
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {subj.percentage}%
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#10233F] mt-2 leading-snug">
                    {subj.subject}
                  </h4>
                  <p className="text-xs text-[#526174] mt-0.5">Faculty: {subj.faculty}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8DCCB]">
                  <div className="flex items-center justify-between text-xs text-[#526174] mb-1.5">
                    <span>Attended: {subj.attended} / {subj.total}</span>
                    <span className="font-bold text-[#10233F]">
                      {isSafe ? 'Compliant' : 'Shortage Alert'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#E8DCCB]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isSafe ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                      style={{ width: `${subj.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Date-Wise Attendance History Logs */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8DCCB] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DCCB]">
          <div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-[#89190E]" />
              <h3 className="font-serif text-lg font-bold text-[#10233F]">
                Attendance Calendar & Daily Session History
              </h3>
            </div>
            <p className="text-xs text-[#526174] mt-0.5">
              Synced with institute RFID biometric turnstiles and faculty electronic registers.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="p-2 rounded-xl border border-[#E8DCCB] bg-[#FFF9EF] text-xs font-semibold text-[#10233F] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Present">Present Only</option>
              <option value="Absent">Absent Only</option>
              <option value="Excused">Excused Leave</option>
            </select>
          </div>
        </div>

        {/* History Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF9EF] text-[#10233F] border-b border-[#E8DCCB]">
              <tr>
                <th className="p-3 font-serif font-bold">Date & Day</th>
                <th className="p-3 font-serif font-bold">Subject / Session</th>
                <th className="p-3 font-serif font-bold">Timing</th>
                <th className="p-3 font-serif font-bold">Verification Source</th>
                <th className="p-3 font-serif font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCCB]/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FFF9EF]/40 transition-colors">
                  <td className="p-3">
                    <span className="font-bold text-[#10233F] block">{log.date}</span>
                    <span className="text-[10px] text-[#526174]">{log.day}</span>
                  </td>
                  <td className="p-3 font-semibold text-[#10233F]">{log.subject}</td>
                  <td className="p-3 font-mono text-[#526174]">{log.time}</td>
                  <td className="p-3 text-[#526174]">{log.markedBy}</td>
                  <td className="p-3 text-right">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        log.status === 'Present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'Excused'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.status === 'Present' && <CheckCircle2 className="w-3 h-3" />}
                      {log.status === 'Absent' && <XCircle className="w-3 h-3" />}
                      {log.status === 'Excused' && <AlertTriangle className="w-3 h-3" />}
                      <span>{log.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
