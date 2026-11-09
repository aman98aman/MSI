import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  Calendar,
  Award,
  Clock,
  Video,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Play,
  UserPlus,
  Flame,
  GraduationCap,
} from 'lucide-react';
import {
  TeacherProfile,
  TeacherCourse,
  TeacherClassSchedule,
  AssessmentItem,
} from './data/teacherMockData';
import { TeacherModuleTab } from './TeacherSidebar';
import { getStoredTeachers, LMS_SYNC_EVENT, MSICourse } from '@/lib/lmsStore';
import GlassCard from '../glass/GlassCard';
import GlassStatCard from '../glass/GlassStatCard';
import GlassButton from '../glass/GlassButton';

interface TeacherDashboardTabProps {
  teacher: TeacherProfile;
  courses: TeacherCourse[];
  lmsCourses?: MSICourse[];
  schedules: TeacherClassSchedule[];
  assessments: AssessmentItem[];
  totalStudents: number;
  onNavigateTab: (tab: TeacherModuleTab) => void;
  onLaunchAttendance: (session: TeacherClassSchedule) => void;
  onOpenLectureModal?: (course: MSICourse) => void;
  onOpenEnrollModal?: (course?: MSICourse) => void;
}

export default function TeacherDashboardTab({
  teacher,
  courses,
  lmsCourses = [],
  schedules,
  assessments,
  totalStudents,
  onNavigateTab,
  onLaunchAttendance,
  onOpenLectureModal,
  onOpenEnrollModal,
}: TeacherDashboardTabProps) {
  const upcomingClasses = schedules.filter((s) => s.day === 'Today');

  // Super Admin approval check
  const [approvalStatus, setApprovalStatus] = useState<
    'approved' | 'pending' | 'rejected' | 'suspended'
  >('approved');

  const checkStatus = () => {
    const stored = getStoredTeachers();
    const found = stored.find((t) => t.id === teacher.id || t.email === teacher.email);
    if (found) {
      setApprovalStatus(found.status);
    } else {
      setApprovalStatus('approved');
    }
  };

  useEffect(() => {
    checkStatus();
    const handleSync = () => checkStatus();
    window.addEventListener(LMS_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(LMS_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [teacher.id]);

  return (
    <div className="space-y-7">
      {/* Super Admin Status Banner */}
      {approvalStatus === 'approved' ? (
        <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm backdrop-blur-md">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>
              <strong className="font-semibold">Super Admin Status: Verified & Approved</strong> • Authorized to teach, publish courses, and evaluate judicial answer scripts.
            </span>
          </div>
          <Link
            href="/super-admin"
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 underline hover:text-emerald-900 dark:hover:text-emerald-100 whitespace-nowrap self-start sm:self-auto transition-colors"
          >
            Super Admin Hub →
          </Link>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-500/15 dark:bg-amber-950/40 border-2 border-amber-400/60 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md backdrop-blur-md animate-pulse">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-amber-700 dark:text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-bold text-sm block">Status: Pending Super Admin Approval</span>
              <span className="text-[11px] opacity-80">
                Your faculty application and demo lectures are currently being verified by the Super Admin Director.
              </span>
            </div>
          </div>
          <Link
            href="/super-admin"
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm whitespace-nowrap self-start sm:self-auto"
          >
            Review in Super Admin →
          </Link>
        </div>
      )}

      {/* 1. Faculty Welcome Banner - Premium Ambient Gradient Glass */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-[#0F1E36] via-[#1A2D4E] to-[#6A1610] text-white shadow-2xl relative overflow-hidden border border-white/10 dark:border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(239,201,136,0.18),transparent_50%)] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
          <div className="max-w-2xl min-w-0">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EFC988] animate-pulse flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-mono tracking-wider text-[#EFC988] uppercase font-bold">
                {teacher.department} • {teacher.stream} Discipline
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white mt-2 tracking-tight">
              Good day, {teacher.name}
            </h1>
            <p className="text-white/80 text-xs sm:text-sm mt-2 leading-relaxed">
              You have <strong className="text-[#EFC988]">{courses.length} active courses assigned</strong>, overseeing{' '}
              <strong className="text-white">{totalStudents} enrolled students</strong>. You have {upcomingClasses.length} lectures scheduled for today.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6 w-full sm:w-auto">
              <button
                onClick={() => onNavigateTab('classes')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-linear-to-r from-[#89190E] to-[#B22222] hover:opacity-95 text-white text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-[#89190E]/30 active:scale-98 transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-[#EFC988]" />
                <span>Manage Today's Classes</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigateTab('assessment')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/20 backdrop-blur-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Award className="w-4 h-4 text-[#EFC988]" />
                <span>Create Assessment</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Tile */}
          <div className="grid grid-cols-2 md:flex md:flex-col gap-3 w-full md:w-auto flex-shrink-0">
            <div className="p-4 rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/15 text-center min-w-0 shadow-inner">
              <span className="text-[10px] font-mono tracking-wider uppercase text-white/70 block">
                Total Enrolled
              </span>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#EFC988] mt-0.5 block">
                {totalStudents}
              </span>
              <span className="text-[10px] text-emerald-300 font-semibold block truncate">{teacher.stream} Scholars</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/15 text-center min-w-0 shadow-inner">
              <span className="text-[10px] font-mono tracking-wider uppercase text-white/70 block">
                Average Score
              </span>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-white mt-0.5 block">
                81.2%
              </span>
              <span className="text-[10px] text-[#EFC988] font-semibold block truncate">Term Diagnostics</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards: Assigned Courses, Subjects, Students, Classes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassStatCard
          title="Assigned Courses"
          value={courses.length}
          trend={{ value: `${courses.length} Active`, isPositive: true }}
          icon={<BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          sparklineData={[4, 5, 5, 6, 7, 7, courses.length]}
          description={courses.map((c) => c.code).join(', ')}
          onClick={() => onNavigateTab('content')}
        />

        <GlassStatCard
          title="Teaching Papers"
          value={teacher.assignedSubjects.length}
          trend={{ value: 'Full Syllabus', isPositive: true }}
          icon={<GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          sparklineData={[1, 2, 2, 3, 3, teacher.assignedSubjects.length]}
          description={teacher.assignedSubjects[0] || 'Core Curriculum'}
          onClick={() => onNavigateTab('content')}
        />

        <GlassStatCard
          title="Enrolled Students"
          value={totalStudents}
          trend={{ value: `${teacher.stream} Stream`, isPositive: true }}
          icon={<Users className="w-5 h-5 text-[#89190E] dark:text-[#EFC988]" />}
          sparklineData={[32, 45, 58, 70, 85, 96, totalStudents]}
          description="Role-isolated cohort"
          onClick={() => onNavigateTab('monitoring')}
        />

        <GlassStatCard
          title="Upcoming Classes"
          value={upcomingClasses.length}
          trend={{ value: 'Scheduled Today', isPositive: true }}
          icon={<Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          sparklineData={[2, 1, 3, 2, 4, 3, upcomingClasses.length]}
          description={`Next: ${upcomingClasses[0]?.time || 'Completed'}`}
          onClick={() => onNavigateTab('classes')}
        />
      </div>

      {/* 3. Main Dashboard 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        {/* Left Column (2 spans): Assigned Courses & Upcoming Schedule */}
        <div className="lg:col-span-2 space-y-7">
          
          {/* Assigned Courses Subsection */}
          <GlassCard variant="elevated" className="p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-gray-200/50 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#89190E] dark:text-[#EFC988] flex-shrink-0" />
                <h3 className="font-serif text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Assigned Courses & Curriculum Progress
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('content')}
                className="text-xs font-bold text-[#89190E] dark:text-[#EFC988] hover:underline flex items-center space-x-1 self-start sm:self-center transition-colors cursor-pointer"
              >
                <span>Manage Course Content</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-gray-200/40 dark:divide-white/10 mt-2 space-y-6">
              {lmsCourses.length > 0 ? (
                lmsCourses.map((course) => {
                  const allLectures = course.sections ? course.sections.flatMap((s) => s.lectures) : [];
                  const progressPct = Math.min(
                    100,
                    Math.round((allLectures.length / Math.max(1, course.totalLectures || 10)) * 100)
                  );

                  return (
                    <div key={course.id} className="pt-5 first:pt-2 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#89190E]/10 dark:bg-[#89190E]/20 text-[#89190E] dark:text-[#EFC988] uppercase">
                              {course.category}
                            </span>
                            {course.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                {course.badge}
                              </span>
                            )}
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                              Faculty: <strong className="text-gray-700 dark:text-gray-200">{course.instructorName}</strong>
                            </span>
                          </div>
                          <h4 className="font-serif font-bold text-base text-gray-900 dark:text-white leading-snug">
                            {course.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                            {course.headline}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
                          <button
                            onClick={() => onOpenEnrollModal?.(course)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-600 hover:text-white border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                            title="Enroll registered student into this course"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>+ Enroll</span>
                          </button>

                          <button
                            onClick={() => onOpenLectureModal?.(course)}
                            className="px-3 py-1.5 rounded-xl bg-linear-to-r from-[#89190E] to-[#B22222] hover:opacity-95 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add Lec {allLectures.length + 1}</span>
                          </button>

                          <button
                            onClick={() => onOpenLectureModal?.(course)}
                            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30 bg-white/50 dark:bg-white/5 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all cursor-pointer"
                          >
                            <span>Manage ({allLectures.length})</span>
                          </button>
                        </div>
                      </div>

                      {/* Lectures Delivered Roster (Lecture-wise display) */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1.5">
                            <Video className="w-3.5 h-3.5 text-[#89190E] dark:text-[#EFC988]" />
                            <span>Lecture Sequence ({allLectures.length} Delivered):</span>
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                            Total: {course.totalDuration}
                          </span>
                        </div>

                        {allLectures.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {allLectures.map((lec, idx) => (
                              <div
                                key={lec.id}
                                onClick={() => onOpenLectureModal?.(course)}
                                className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 hover:border-[#89190E] dark:hover:border-[#EFC988] transition-all cursor-pointer flex items-start justify-between gap-2 group shadow-xs hover:shadow-md"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center space-x-1.5 mb-0.5">
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#89190E]/10 dark:bg-[#89190E]/20 text-[#89190E] dark:text-[#EFC988]">
                                      {/^lecture\s*\d+/i.test(lec.title)
                                        ? lec.title.split(':')[0]
                                        : `Lecture ${idx + 1}`}
                                    </span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                                      ⏱ {lec.duration}
                                    </span>
                                  </div>
                                  <h5 className="font-serif font-bold text-xs text-gray-900 dark:text-white group-hover:text-[#89190E] dark:group-hover:text-[#EFC988] transition-colors truncate">
                                    {lec.title}
                                  </h5>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                    {lec.summary || 'Classroom recording with case briefs.'}
                                  </p>
                                </div>

                                <div className="p-1 rounded-lg bg-[#89190E]/10 dark:bg-white/10 group-hover:bg-[#89190E] group-hover:text-white text-[#89190E] dark:text-[#EFC988] transition-colors mt-0.5 shrink-0">
                                  <Play className="w-3 h-3 fill-current" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span>No lectures uploaded yet for this course. Click below to add Lecture 1!</span>
                            <button
                              onClick={() => onOpenLectureModal?.(course)}
                              className="px-3 py-1.5 rounded-xl bg-linear-to-r from-[#89190E] to-[#B22222] hover:opacity-95 text-white text-[11px] font-bold self-start sm:self-auto cursor-pointer"
                            >
                              + Add Lecture 1
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Syllabus Progress Bar */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>
                            Lectures Delivered: <strong className="text-gray-800 dark:text-gray-200">{allLectures.length} of {course.totalLectures || 20} Target</strong>
                          </span>
                          <span className="font-bold text-[#89190E] dark:text-[#EFC988]">{progressPct}% Complete</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200/70 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-[#89190E] to-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                courses.map((course) => (
                  <div key={course.id} className="pt-4 first:pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#89190E]/10 dark:bg-[#89190E]/20 text-[#89190E] dark:text-[#EFC988]">
                            {course.code}
                          </span>
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            {course.batch}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-base text-gray-900 dark:text-white mt-1">
                          {course.title}
                        </h4>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {course.totalStudents} Students Enrolled
                        </span>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Next lecture: {course.nextLectureTime}
                        </p>
                      </div>
                    </div>

                    {/* Syllabus Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>
                          Lectures Delivered: <strong className="text-gray-800 dark:text-gray-200">{course.lecturesCompleted} / {course.totalLectures}</strong>
                        </span>
                        <span className="font-bold text-[#89190E] dark:text-[#EFC988]">{course.progress}% Completed</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200/70 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-[#89190E] to-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

          {/* Upcoming Classes & Electronic Register Launcher */}
          <GlassCard variant="elevated" className="p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-gray-200/50 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#89190E] dark:text-[#EFC988] flex-shrink-0" />
                <h3 className="font-serif text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Today's Teaching Schedule
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('classes')}
                className="text-xs font-bold text-[#89190E] dark:text-[#EFC988] hover:underline self-start sm:self-center transition-colors cursor-pointer"
              >
                Full Weekly Timetable →
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {schedules.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    session.isLiveNow
                      ? 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600/50 ring-1 ring-amber-400/30'
                      : 'bg-white/60 dark:bg-white/5 border-gray-200/60 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/20'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-gray-900 text-white dark:bg-white/20">
                        {session.time}
                      </span>
                      <span className="text-xs font-semibold text-[#89190E] dark:text-[#EFC988]">{session.type}</span>
                      {session.isLiveNow && (
                        <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Happening Now
                        </span>
                      )}
                    </div>
                    <h4 className="font-serif font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                      {session.subject}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Batch: {session.batch} • Venue: {session.venue}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => onLaunchAttendance(session)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/80 dark:bg-white/10 border border-[#89190E]/60 dark:border-[#EFC988]/60 text-[#89190E] dark:text-[#EFC988] hover:bg-[#89190E] hover:text-white dark:hover:bg-[#EFC988] dark:hover:text-gray-950 text-xs font-bold transition-all text-center cursor-pointer shadow-xs"
                    >
                      Mark Attendance
                    </button>
                    {session.meetLink && (
                      <a
                        href={session.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto justify-center px-4 py-2 rounded-xl bg-linear-to-r from-[#89190E] to-[#B22222] hover:opacity-95 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5 text-[#EFC988]" />
                        <span>Enter Live Session</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>

        {/* Right Column (1 span): Recent Results & Diagnostic Analytics */}
        <div className="space-y-7">
          
          {/* Recent Results Card */}
          <GlassCard variant="elevated" className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200/50 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-[#89190E] dark:text-[#EFC988]" />
                <h3 className="font-serif text-base font-bold text-gray-900 dark:text-white">
                  Recent Exam Results
                </h3>
              </div>
              <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">Diagnostic Cell</span>
            </div>

            <div className="divide-y divide-gray-200/40 dark:divide-white/10 mt-2 space-y-3">
              {assessments.map((asmt) => (
                <div key={asmt.id} className="pt-3 first:pt-1">
                  <div className="flex items-start justify-between">
                    <h5 className="text-xs font-bold text-gray-900 dark:text-white leading-snug">
                      {asmt.title}
                    </h5>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      {asmt.submissionsCount} Subs
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    Course: {asmt.courseCode} • Max: {asmt.marks} Marks
                  </p>
                  {asmt.averageScore && (
                    <div className="mt-2 p-2 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Batch Average:</span>
                      <span className="font-serif font-bold text-[#89190E] dark:text-[#EFC988]">
                        {asmt.averageScore}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab('assessment')}
              className="mt-4 w-full py-2.5 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-[#89190E] hover:text-white dark:hover:bg-[#EFC988] dark:hover:text-gray-950 text-[#89190E] dark:text-[#EFC988] border border-gray-200 dark:border-white/10 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              View Detailed Scorecards →
            </button>
          </GlassCard>

          {/* Quick Mentorship & Stream Notice */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-[#0E1A2E] to-[#1E3A5F] text-white shadow-xl relative overflow-hidden border border-white/10">
            <div className="relative z-10">
              <span className="text-[10px] font-mono tracking-widest text-[#EFC988] uppercase font-bold block">
                Academic Integrity & Bar Council Audit
              </span>
              <h4 className="font-serif text-lg font-bold text-white mt-1">
                Remedial Mentorship Active
              </h4>
              <p className="text-xs text-white/80 mt-1.5 leading-relaxed">
                2 students in your assigned batches are currently below the statutory 75% attendance threshold. You can schedule 1-on-1 counsel sessions in Communication.
              </p>

              <button
                onClick={() => onNavigateTab('communication')}
                className="mt-4 w-full py-2.5 rounded-xl bg-linear-to-r from-[#89190E] to-[#B22222] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Open Mentorship Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
