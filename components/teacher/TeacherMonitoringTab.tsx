'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  BarChart3,
  CalendarCheck,
  Award,
  ChevronRight,
  ShieldCheck,
  BookOpen,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import { StudentMonitoringRecord, TeacherCourse } from './data/teacherMockData';
import { MSICourse, CourseEnrollment, getStoredEnrollments, LMS_SYNC_EVENT } from '@/lib/lmsStore';
import GlassCard from '../glass/GlassCard';
import GlassStatCard from '../glass/GlassStatCard';

interface TeacherMonitoringTabProps {
  students: StudentMonitoringRecord[];
  courses: TeacherCourse[];
  lmsCourses?: MSICourse[];
  stream: 'Law' | 'JEE';
  registeredStudents?: { id: string; name: string; phone: string; stream: string }[];
  onOpenEnrollModal?: (course?: MSICourse) => void;
  activeTeacherName?: string;
  activeTeacherId?: string;
}

export default function TeacherMonitoringTab({
  students,
  courses,
  lmsCourses = [],
  stream,
  registeredStudents = [],
  onOpenEnrollModal,
  activeTeacherName = 'Dr. Ekta Gahlawat',
  activeTeacherId = 'fac-law-ekta',
}: TeacherMonitoringTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'All' | 'Safe' | 'Attention' | 'Critical'>('All');
  const [selectedStudent, setSelectedStudent] = useState<StudentMonitoringRecord | null>(null);

  // Real-time enrollments for this faculty
  const [facultyEnrollments, setFacultyEnrollments] = useState<CourseEnrollment[]>([]);

  const loadFacultyEnrollments = () => {
    try {
      const all = getStoredEnrollments();
      const myCourseIds = lmsCourses.map((c) => c.id);
      const cleanTeacherName = activeTeacherName.toLowerCase().trim();
      const cleanTeacherId = activeTeacherId.toLowerCase().trim();

      const matched = all.filter((e) => {
        // Enrolled in one of this faculty's courses
        if (myCourseIds.includes(e.courseId)) return true;
        // Or explicitly assigned by this teacher
        if (e.assignedByTeacherId && e.assignedByTeacherId.toLowerCase().trim() === cleanTeacherId) return true;
        if (e.assignedByName && e.assignedByName.toLowerCase().includes(cleanTeacherName)) return true;
        return false;
      });
      setFacultyEnrollments(matched);
    } catch (_) {}
  };

  useEffect(() => {
    loadFacultyEnrollments();
    const handleSync = () => loadFacultyEnrollments();
    window.addEventListener(LMS_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('msi_courses_sync', handleSync);
    return () => {
      window.removeEventListener(LMS_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('msi_courses_sync', handleSync);
    };
  }, [lmsCourses, activeTeacherId, activeTeacherName]);

  const filteredStudents = students.filter((s) => {
    if (riskFilter !== 'All' && s.riskLevel !== riskFilter) return false;
    if (searchQuery.trim() && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const safeCount = students.filter((s) => s.riskLevel === 'Safe').length;
  const attentionCount = students.filter((s) => s.riskLevel === 'Attention').length;
  const criticalCount = students.filter((s) => s.riskLevel === 'Critical').length;

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Grid */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-[#0E1A2E] via-[#162D50] to-[#6A1610] text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
          <div className="max-w-xl">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-[#EFC988]" />
              <span className="text-[10px] sm:text-xs font-mono tracking-widest text-[#EFC988] uppercase font-bold">
                Student Progress & Faculty Batch Enrollment
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1.5">
              Academic Cohort Monitoring • {stream} Stream
            </h2>
            <p className="text-white/80 text-xs sm:text-sm mt-2 leading-relaxed">
              Enroll verified students into your courses, monitor classroom attendance, and track regulatory Bar Council compliance in real time.
            </p>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => onOpenEnrollModal?.()}
                className="px-5 py-2.5 rounded-xl bg-[#EFC988] hover:bg-[#ffe2aa] text-[#10233F] text-xs font-bold flex items-center space-x-2 shadow-md active:scale-98 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-[#89190E]" />
                <span>+ Enroll Student in My Course</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/15 text-center min-w-[100px]">
              <span className="text-[10px] font-mono uppercase text-indigo-300 block">Enrolled</span>
              <span className="font-serif text-2xl font-bold text-white mt-0.5 block">{facultyEnrollments.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/15 text-center min-w-[100px]">
              <span className="text-[10px] font-mono uppercase text-emerald-300 block">Safe ({'>'}75%)</span>
              <span className="font-serif text-2xl font-bold text-white mt-0.5 block">{safeCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/15 text-center min-w-[100px]">
              <span className="text-[10px] font-mono uppercase text-amber-300 block">Borderline</span>
              <span className="font-serif text-2xl font-bold text-white mt-0.5 block">{attentionCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REAL ENROLLED STUDENTS TABLE (Assigned by Faculty / Super Admin) */}
      <GlassCard variant="elevated" className="p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200/50 dark:border-white/10">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-[#89190E] dark:text-[#EFC988]" />
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Students Enrolled in My Courses ({facultyEnrollments.length})
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Students actively enrolled in your curriculum courses. They see your course on their student dashboard.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenEnrollModal?.()}
            className="px-4 py-2 rounded-xl bg-linear-to-r from-[#89190E] to-[#B22222] hover:opacity-95 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4 text-[#EFC988]" />
            <span>+ Enroll Student</span>
          </button>
        </div>

        {facultyEnrollments.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400 bg-white/40 dark:bg-white/5 rounded-2xl border border-gray-200/60 dark:border-white/10 mt-4">
            <UserCheck className="w-8 h-8 text-[#89190E]/60 dark:text-[#EFC988]/60 mx-auto mb-2" />
            <p className="font-bold text-gray-800 dark:text-gray-200">No students enrolled yet in your courses.</p>
            <p className="mt-1">Click &quot;+ Enroll Student in My Course&quot; above to assign any registered student to your batch.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/60 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-b border-gray-200/50 dark:border-white/10">
                <tr>
                  <th className="p-3 font-serif font-bold">Student Name</th>
                  <th className="p-3 font-serif font-bold">Mobile Number</th>
                  <th className="p-3 font-serif font-bold">Enrolled Course</th>
                  <th className="p-3 font-serif font-bold">Enrolled At</th>
                  <th className="p-3 font-serif font-bold">Assignment Source</th>
                  <th className="p-3 font-serif font-bold text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/40 dark:divide-white/10">
                {facultyEnrollments.map((enr) => {
                  const courseObj = lmsCourses.find((c) => c.id === enr.courseId);
                  const isAssignedByMe =
                    (enr.assignedByTeacherId && enr.assignedByTeacherId.toLowerCase() === activeTeacherId.toLowerCase()) ||
                    (enr.assignedByName && enr.assignedByName.toLowerCase().includes(activeTeacherName.toLowerCase()));

                  return (
                    <tr key={`${enr.studentId}-${enr.courseId}`} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                      <td className="p-3 font-bold text-gray-900 dark:text-white">
                        {enr.studentName || `Student ${enr.studentId.slice(-4)}`}
                      </td>
                      <td className="p-3 font-mono text-gray-600 dark:text-gray-400">
                        +91 {enr.studentPhone || '—'}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-[#89190E] dark:text-[#EFC988] block line-clamp-1">
                          {courseObj?.title || enr.courseTitle || enr.courseId}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                          ID: {enr.courseId}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500 dark:text-gray-400">{enr.enrolledAt}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isAssignedByMe
                              ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                              : enr.assignedBy === 'super-admin'
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>
                            {isAssignedByMe
                              ? `Assigned by You (${activeTeacherName})`
                              : enr.assignedBy === 'super-admin'
                              ? 'Super Admin Assignment'
                              : 'Self Enrolled'}
                          </span>
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#89190E] dark:text-[#EFC988]">
                        {enr.progressPercentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* 3. Search & Filter Bar */}
      <GlassCard variant="default" className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student name or roll no..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#89190E] dark:focus:border-[#EFC988]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Filter Attendance Risk:</span>
          {(['All', 'Safe', 'Attention', 'Critical'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                riskFilter === r
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-950 shadow-xs'
                  : 'bg-white/60 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200/60 dark:border-white/10'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* 4. Student Roster Table */}
      <GlassCard variant="elevated" className="p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200/50 dark:border-white/10">
          <h3 className="font-serif text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            Batch Performance Ledger ({filteredStudents.length})
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Enforcing stream isolation: <strong className="text-gray-700 dark:text-gray-200">{stream}</strong> students only
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100/60 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-b border-gray-200/50 dark:border-white/10">
              <tr>
                <th className="p-3 font-serif font-bold">Student Name & Roll</th>
                <th className="p-3 font-serif font-bold">Batch Assignment</th>
                <th className="p-3 font-serif font-bold">Attendance %</th>
                <th className="p-3 font-serif font-bold">Diagnostic Average</th>
                <th className="p-3 font-serif font-bold">Assignments</th>
                <th className="p-3 font-serif font-bold text-right">Regulatory Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/40 dark:divide-white/10">
              {filteredStudents.map((stu) => (
                <tr
                  key={stu.id}
                  onClick={() => setSelectedStudent(stu)}
                  className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <td className="p-3">
                    <span className="font-bold text-gray-900 dark:text-white block">{stu.name}</span>
                    <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400">{stu.rollNo}</span>
                  </td>
                  <td className="p-3 text-gray-500 dark:text-gray-400">{stu.batch}</td>
                  <td className="p-3">
                    <span
                      className={`font-mono font-bold ${
                        stu.attendancePercentage >= 75
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {stu.attendancePercentage}%
                    </span>
                  </td>
                  <td className="p-3 font-serif font-bold text-gray-800 dark:text-gray-200">
                    {stu.avgTestScore}%
                  </td>
                  <td className="p-3 text-gray-500 dark:text-gray-400">
                    {stu.assignmentsCompleted} / {stu.totalAssignments} Submitted
                  </td>
                  <td className="p-3 text-right">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        stu.riskLevel === 'Safe'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : stu.riskLevel === 'Attention'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 animate-pulse'
                      }`}
                    >
                      {stu.riskLevel === 'Safe' && <CheckCircle2 className="w-3 h-3" />}
                      {stu.riskLevel === 'Attention' && <AlertTriangle className="w-3 h-3" />}
                      {stu.riskLevel === 'Critical' && <AlertTriangle className="w-3 h-3" />}
                      <span>{stu.riskLevel === 'Safe' ? 'Compliant' : stu.riskLevel === 'Attention' ? 'Near Shortage' : 'Shortage Alert'}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* 5. Student History Drawer Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#121A2B]/95 border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-xl">
            <div className="flex items-start justify-between pb-3 border-b border-gray-200/50 dark:border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#89190E] dark:text-[#EFC988]">
                  Detailed Student Academic History
                </span>
                <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
                  {selectedStudent.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Roll: {selectedStudent.rollNo} • {selectedStudent.batch}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 text-gray-400 hover:text-gray-800 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
                <span className="text-gray-500 dark:text-gray-400 block">Statutory Attendance</span>
                <span className="font-serif text-xl font-bold text-[#89190E] dark:text-[#EFC988]">
                  {selectedStudent.attendancePercentage}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
                <span className="text-gray-500 dark:text-gray-400 block">Diagnostic Avg</span>
                <span className="font-serif text-xl font-bold text-gray-900 dark:text-white">
                  {selectedStudent.avgTestScore}%
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200">
              <strong>Faculty Action Note:</strong> Student is flagged as <strong>{selectedStudent.riskLevel}</strong>. You may schedule a personalized 1-on-1 counsel session in the Communication tab.
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-950 text-xs font-bold cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
