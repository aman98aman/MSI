'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Calendar,
  Clock,
  Award,
  AlertCircle,
  CreditCard,
  Video,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Lock,
  PlayCircle,
  PlusCircle,
  GraduationCap,
  Radio,
  Package,
  Truck,
  Download,
  FileText,
  X,
  UserCheck,
  Play,
  Flame,
} from 'lucide-react';
import {
  StudentProfile,
  ActiveCourse,
  TimetableClass,
  StudentNotification,
  TestItem,
} from './data/studentMockData';
import { StudentModuleTab } from './StudentSidebar';
import {
  MSICourse,
  CourseEnrollment,
  getStoredCourses,
  getStoredEnrollments,
  syncCoursesFromServer,
  syncEnrollmentsFromServer,
  LMS_SYNC_EVENT,
} from '@/lib/lmsStore';
import StudentActivityHeatmap from './StudentActivityHeatmap';
import { getSavedRecordedLectures, RecordedLectureItem } from '@/lib/liveStreamPeer';
import GlassCard from '@/components/glass/GlassCard';
import GlassButton from '@/components/glass/GlassButton';

interface StudentDashboardTabProps {
  student: StudentProfile;
  courses: ActiveCourse[];
  upcomingClasses: TimetableClass[];
  notifications: StudentNotification[];
  tests: TestItem[];
  onNavigateTab: (tab: StudentModuleTab) => void;
  onStartTest: (test: TestItem) => void;
  onOpenMSICourse?: (course: MSICourse) => void;
}

export default function StudentDashboardTab({
  student,
  courses,
  upcomingClasses,
  notifications,
  tests,
  onNavigateTab,
  onStartTest,
  onOpenMSICourse,
}: StudentDashboardTabProps) {
  const handleOpenCourse = onOpenMSICourse;
  const activeEnrolledCourses = courses.filter((c) => c.isEnrolled);
  const avgProgress = Math.round(
    activeEnrolledCourses.reduce((acc, c) => acc + c.progress, 0) /
      (activeEnrolledCourses.length || 1)
  );

  const availableTest = tests.find((t) => t.status === 'Available');

  // Dynamic MSI LMS Enrollments for this student
  const [enrolledMsiData, setEnrolledMsiData] = useState<{
    course: MSICourse;
    enrollment: CourseEnrollment;
  }[]>([]);

  // Purchased Study Material & Book Kits
  const [purchasedKits, setPurchasedKits] = useState<{
    id: string;
    itemId: string;
    title: string;
    price: number;
    orderDate: string;
    receiptNumber?: string;
    status: string;
    trackingNumber: string;
  }[]>([]);

  const loadPurchasedKits = () => {
    try {
      const localKits = JSON.parse(localStorage.getItem('msi_student_purchased_kits') || '[]');
      const profileKits = (student.profile as any)?.purchasedKits || [];
      const combined = [...localKits];
      profileKits.forEach((pk: any) => {
        if (!combined.some((k) => k.id === pk.id || (k.itemId && k.itemId === pk.itemId))) {
          combined.push(pk);
        }
      });
      setPurchasedKits(combined);
    } catch (_) {}
  };

  const loadEnrolledMsi = async () => {
    try {
      await syncCoursesFromServer();
      await syncEnrollmentsFromServer();
    } catch (_) {}

    const allCourses = getStoredCourses();
    const allEnrollments = getStoredEnrollments();
    const storedPhone = typeof window !== 'undefined' ? localStorage.getItem('msi_active_student_phone') || '' : '';
    const cleanPhone = (student.phone || storedPhone).replace(/\D/g, '').slice(-10);

    const studentEnrollments = allEnrollments.filter((e) => {
      const ePhone = (e.studentPhone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone && ePhone === cleanPhone) return true;
      if (student.id && e.studentId === student.id) return true;
      if (cleanPhone && (e.studentId.includes(cleanPhone) || e.studentId.endsWith(cleanPhone.slice(-4)))) return true;
      if (!cleanPhone && (e.studentId === 'msi-stu-001' || student.id === 'msi-stu-001')) return true;
      return false;
    });

    const merged = studentEnrollments
      .map((enr) => {
        const found = allCourses.find((c) => c.id === enr.courseId);
        if (!found) return null;
        return { course: found, enrollment: enr };
      })
      .filter(Boolean) as { course: MSICourse; enrollment: CourseEnrollment }[];

    if (merged.length === 0 && student.stream) {
      const streamLower = student.stream.toLowerCase();
      const matchedCourse = allCourses.find((c) => {
        const cTitleLower = c.title.toLowerCase();
        if (streamLower.includes('pcs-j') && cTitleLower.includes('pcs')) return true;
        if (streamLower.includes('clat') && cTitleLower.includes('clat')) return true;
        if (streamLower.includes('judiciary') && cTitleLower.includes('judic')) return true;
        return false;
      });
      if (matchedCourse) {
        merged.push({
          course: matchedCourse,
          enrollment: {
            studentId: student.id,
            courseId: matchedCourse.id,
            enrolledAt: 'Immediate Academic Clearance',
            progressPercentage: 15,
            completedLectureIds: [],
            assignedBy: 'super-admin',
            assignedByName: 'MSI Academic Directorate',
            assignedNote: `Admitted under ${student.stream}`,
            certificateIssued: false,
          },
        });
      }
    }

    setEnrolledMsiData(merged);
  };

  useEffect(() => {
    loadEnrolledMsi();
    loadPurchasedKits();

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('msi_sync_channel');
        bc.onmessage = (event) => {
          if (
            event.data?.type === 'COURSE_CREATED' ||
            event.data?.type === 'COURSE_DELETED' ||
            event.data?.type === 'STUDENT_ENROLLED'
          ) {
            loadEnrolledMsi();
          }
        };
      }
    } catch (_) {}

    const handleSync = () => {
      loadEnrolledMsi();
      loadPurchasedKits();
    };

    window.addEventListener(LMS_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('msi_kits_sync', handleSync);
    return () => {
      if (bc) bc.close();
      window.removeEventListener(LMS_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('msi_kits_sync', handleSync);
    };
  }, [student.id, student.phone, student.stream]);

  // Live Broadcast Listener for Enrolled Courses
  const [activeLiveStream, setActiveLiveStream] = useState<{
    isLive: boolean;
    courseId?: string;
    courseTitle?: string;
    teacherName?: string;
    timestamp?: number;
  } | null>(null);
  const [dismissedLive, setDismissedLive] = useState(false);

  // Saved VOD Recordings
  const [recordedLectures, setRecordedLectures] = useState<RecordedLectureItem[]>([]);

  const loadRecordings = () => {
    setRecordedLectures(getSavedRecordedLectures());
  };

  useEffect(() => {
    loadRecordings();
    const handleStorageRecordings = () => loadRecordings();
    window.addEventListener('storage', handleStorageRecordings);
    window.addEventListener('msi_recorded_lectures_updated', handleStorageRecordings);
    return () => {
      window.removeEventListener('storage', handleStorageRecordings);
      window.removeEventListener('msi_recorded_lectures_updated', handleStorageRecordings);
    };
  }, []);

  useEffect(() => {
    const checkLiveStatus = () => {
      if (typeof window !== 'undefined') {
        const activeData = localStorage.getItem('msi_active_live_stream');
        if (activeData) {
          try {
            const parsed = JSON.parse(activeData);
            if (parsed.isLive) {
              setActiveLiveStream(parsed);
              return;
            }
          } catch {}
        }
        setActiveLiveStream(null);
      }
    };

    checkLiveStatus();

    const checkServerLiveStatus = async () => {
      try {
        const res = await fetch('/api/live-stream');
        if (!res.ok) return;
        const data = await res.json();
        if (data.isLive) {
          const isTargetCohort =
            !data.targetBatch ||
            data.targetBatch === 'All Enrolled Batches' ||
            data.targetBatch.includes('Semester V') ||
            student.batch.includes('Semester V');

          if (isTargetCohort) {
            setActiveLiveStream({
              isLive: true,
              courseId: data.courseId || 'MSI/LEGSTUDIES-/01',
              courseTitle: data.streamTitle,
              teacherName: data.teacherName,
              timestamp: data.startedAt,
            });
            setDismissedLive(false);
          }
        } else {
          setActiveLiveStream(null);
        }
      } catch {}
    };

    checkServerLiveStatus();
    const serverInterval = setInterval(checkServerLiveStatus, 20000);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('msi_live_stream_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'STREAM_STARTED') {
          setActiveLiveStream(event.data);
          setDismissedLive(false);
        } else if (event.data?.type === 'STREAM_ENDED') {
          setActiveLiveStream(null);
          loadRecordings();
        }
      };
    } catch {}

    window.addEventListener('storage', checkLiveStatus);

    return () => {
      bc?.close();
      clearInterval(serverInterval);
      window.removeEventListener('storage', checkLiveStatus);
    };
  }, [student.batch]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Real-time Enrolled Live Class Alert Banner */}
      {activeLiveStream?.isLive && !dismissedLive && (
        <div className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-600 via-rose-700 to-indigo-900 text-white overflow-hidden shadow-2xl border border-rose-400/40 animate-slideDown">
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-400/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
            <div className="flex items-start sm:items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner flex-shrink-0 mt-0.5 sm:mt-0">
                <Radio className="w-6 h-6 animate-pulse text-white" />
              </div>
              
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-white text-rose-700 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                    <span>LIVE CLASS STARTED • ENROLLED COHORT</span>
                  </span>
                  <span className="text-xs font-semibold text-rose-100">
                    Faculty: {activeLiveStream.teacherName || 'Dr. Ekta Gahlawat'}
                  </span>
                </div>
                
                <h3 className="text-base sm:text-xl font-bold text-white leading-snug">
                  {activeLiveStream.courseTitle || 'Live Moot & Masterclass: Constitutional Law Jurisprudence'}
                </h3>
                <p className="text-xs text-white/80">
                  Your instructor is broadcasting live on Bunny.net HD Stream. Click below to enter the live room.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 flex-shrink-0 pt-2 sm:pt-0">
              <Link
                href={`/live-stream?title=${encodeURIComponent(activeLiveStream.courseTitle || 'Live Lecture')}&role=student`}
                className="px-5 py-3 rounded-2xl bg-white text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center space-x-2 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <Video className="w-4 h-4 text-rose-600" />
                <span>Join Live Class Now →</span>
              </Link>

              <button
                onClick={() => setDismissedLive(true)}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Dismiss Notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Welcome & High-Yield Banner (Apple / Linear Ambient Glow) */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#111827] via-[#1E1B4B] to-[#312E81] text-white overflow-hidden shadow-2xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
          <div className="max-w-2xl min-w-0">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-mono tracking-wider text-indigo-300 uppercase font-bold break-words">
                MSI Group of Institutes • Academic Cohort 2026
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white mt-2 tracking-tight">
              Welcome back, {student.name.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              You have <strong className="text-indigo-300 font-semibold">{enrolledMsiData.length} online courses</strong> in your active learning portal. Resume your progress or review recent mock test performance below.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-5 w-full sm:w-auto">
              {enrolledMsiData.length > 0 && handleOpenCourse ? (
                <GlassButton
                  variant="primary"
                  size="md"
                  onClick={() => handleOpenCourse(enrolledMsiData[0].course)}
                  icon={<PlayCircle className="w-4 h-4" />}
                >
                  Resume Masterclass
                </GlassButton>
              ) : (
                <GlassButton
                  variant="primary"
                  size="md"
                  onClick={() => onNavigateTab('learning')}
                  icon={<BookOpen className="w-4 h-4" />}
                >
                  Resume Learning Hub
                </GlassButton>
              )}

              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold border border-white/20 backdrop-blur-md transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-indigo-300" />
                <span>Explore More Courses</span>
              </Link>

              <button
                type="button"
                onClick={() => onNavigateTab('profile')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs sm:text-sm font-semibold border border-indigo-400/30 backdrop-blur-md transition-all active:scale-95"
              >
                <UserCheck className="w-4 h-4 text-indigo-300" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="grid grid-cols-2 md:flex md:flex-col gap-3 sm:gap-4 w-full md:w-auto flex-shrink-0">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-0 shadow-sm">
              <span className="text-[10px] font-mono tracking-wider uppercase text-slate-300 block">
                Enrolled Courses
              </span>
              <span className="text-xl sm:text-3xl font-extrabold text-white mt-0.5 block">
                {enrolledMsiData.length}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold block truncate">Video Curriculum</span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-0 shadow-sm">
              <span className="text-[10px] font-mono tracking-wider uppercase text-slate-300 block">
                Learning Streak
              </span>
              <span className="text-xl sm:text-3xl font-extrabold text-amber-300 mt-0.5 flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
                14 Days
              </span>
              <span className="text-[10px] text-indigo-300 font-semibold block truncate">Consistent Aspirant</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row: Progress, Classes, Tests, Fee Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Courses & Progress */}
        <GlassCard
          variant="interactive"
          padding="md"
          onClick={() => onNavigateTab('learning')}
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-500/30">
              {activeEnrolledCourses.length} Active
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
            Classroom Batches
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Syllabus avg completion: {avgProgress}%
          </p>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </GlassCard>

        {/* Card 2: Upcoming Classes Today */}
        <GlassCard
          variant="interactive"
          padding="md"
          onClick={() => onNavigateTab('dashboard')}
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Today
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
            Upcoming Classes
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {upcomingClasses.filter((c) => c.day === 'Today').length} Lectures remaining
          </p>
          <div className="mt-3 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Next: 09:30 AM (CrPC)</span>
          </div>
        </GlassCard>

        {/* Card 3: Tests & Mock Exams */}
        <GlassCard
          variant="interactive"
          padding="md"
          onClick={() => onNavigateTab('tests')}
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-md shadow-xs">
              1 Open
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
            Tests & Evaluations
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            5-Question Timed Mock #12
          </p>
          <div className="mt-3 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Last Test: 86/100 (94.2%)</span>
          </div>
        </GlassCard>

        {/* Card 4: Fee Status */}
        <GlassCard
          variant="interactive"
          padding="md"
          onClick={() => onNavigateTab('fees')}
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              ₹{((student as any).paidFee || 0).toLocaleString('en-IN')} Paid
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
            Fee Status
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {(student as any).dueFee && (student as any).dueFee > 0
              ? `Due: ₹${(student as any).dueFee.toLocaleString('en-IN')}${(student as any).nextDueDate ? ` (${(student as any).nextDueDate})` : ''}`
              : 'All Dues Cleared ✓'}
          </p>
          <div className="mt-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Valid till 31 Jul 2026</span>
          </div>
        </GlassCard>
      </div>

      {/* 3. MSI ENROLLED MASTERCLASSES SECTION */}
      <GlassCard variant="default" padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-slate-200/60 dark:border-white/5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                My Enrolled Courses & Assigned Masterclasses
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Click on any course to open the interactive classroom with video player, lecture notes, and certificate generator.
              </p>
            </div>
          </div>

          <Link
            href="/courses"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 self-start sm:self-center"
          >
            <span>Browse More Courses</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Enrolled Courses Grid */}
        {enrolledMsiData.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 text-center space-y-3 mt-4">
            <GraduationCap className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mx-auto opacity-70" />
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">No Enrolled Courses Yet</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              You have no active course enrollments yet. Explore our premier judicial & law entrance programmes to get started.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore All Courses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {enrolledMsiData.map(({ course, enrollment }) => {
              const isAssignedByAdmin = enrollment.assignedBy === 'super-admin';

              return (
                <div
                  key={course.id}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 hover:border-indigo-400/60 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md flex flex-col justify-between space-y-4 group shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                        {course.category}
                      </span>

                      {enrollment.assignedBy === 'teacher' ? (
                        <span className="text-[10px] font-mono font-bold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-500/30 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                          <UserCheck className="w-3 h-3" />
                          <span>Faculty: {enrollment.assignedByName || course.instructorName}</span>
                        </span>
                      ) : isAssignedByAdmin ? (
                        <span className="text-[10px] font-mono font-bold uppercase text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-500/30 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Super Admin Clearance</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Self Enrolled</span>
                        </span>
                      )}
                    </div>

                    {/* Course Title & Instructor */}
                    <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug line-clamp-2">
                      {course.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Instructor: <strong className="text-slate-700 dark:text-slate-300">{course.instructorName}</strong>
                    </p>

                    {enrollment.assignedNote && (
                      <div className="mt-2.5 p-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-500/30 text-[11px] text-indigo-700 dark:text-indigo-300">
                        <strong>Directorate Note:</strong> {enrollment.assignedNote}
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mt-3.5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          Progress: {enrollment.completedLectureIds.length} lectures completed
                        </span>
                        <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                          {enrollment.progressPercentage}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(enrollment.progressPercentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card CTA */}
                  <div className="pt-3 flex items-center justify-between border-t border-slate-200/60 dark:border-white/5">
                    <span className="text-[11px] text-slate-400">
                      Enrolled {enrollment.enrolledAt}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenCourse && handleOpenCourse(course)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Open MSI Player</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* 4. Ordered Books & Aspirant Kits Section */}
      <GlassCard variant="default" padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200/60 dark:border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Publications & Doorstep Dispatch
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  {purchasedKits.length} Consignments
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                My Purchased Study Material & Book Kits
              </h3>
            </div>
          </div>

          <Link
            href="/courses#master-books-kits"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 self-start sm:self-center"
          >
            <span>+ Order More Books & Kits</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {purchasedKits.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 text-center space-y-2.5">
            <Package className="w-9 h-9 text-indigo-600 dark:text-indigo-400 mx-auto opacity-70" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">No Books or Aspirant Kits Ordered Yet</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Enhance your legal preparation with the official 6-Book Master Series, CLAT/Judiciary Aspirant Kits, and printed OMR test booklets.
            </p>
            <div className="pt-1">
              <Link
                href="/courses#master-books-kits"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Browse 6-Book Master Series & Kits</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchasedKits.map((kit) => (
              <div
                key={kit.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 hover:border-indigo-400/60 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md flex flex-col justify-between space-y-3 group shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      <span>{kit.status || 'Dispatched from MSI Campus'}</span>
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                      ₹{kit.price.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                    {kit.title}
                  </h4>

                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Tracking ID:</span>
                      <strong className="font-mono text-slate-900 dark:text-white">{kit.trackingNumber || 'MSI-EXP-772910'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Order Date:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{kit.orderDate}</span>
                    </div>
                    {kit.receiptNumber && (
                      <div className="flex justify-between">
                        <span>Receipt:</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{kit.receiptNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified Purchase</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => alert(`Tracking Consignment: ${kit.trackingNumber || 'MSI-EXP-772910'}\nCourier Partner: MSI Express Logistics\nOrigin: MSI Campus, Sector 15 Chandigarh\nCurrent Status: Out for delivery to your registered address.`)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    Track Dispatch
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* 5. 30-DAY STUDY ACTIVITY HEATMAP */}
      <StudentActivityHeatmap
        studentName={student.name}
        onNavigateTab={onNavigateTab}
      />

      {/* 6. Main Dashboard 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">
        
        {/* Left Column (2 spans): Active Courses + Today's Timetable + VOD Archive */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-7">
          
          {/* Active Courses Subsection */}
          <GlassCard variant="default" padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-slate-200/60 dark:border-white/5">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Classroom Batches & Syllabus
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                  Linked to active student enrollment ID #{student.enrollmentNo}
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('learning')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 self-start sm:self-center"
              >
                <span>View All Modules</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Courses List */}
            <div className="divide-y divide-slate-100 dark:divide-white/5 mt-2">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/30">
                        {course.code}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{course.category}</span>
                      {!course.isEnrolled && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center space-x-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Entitlement Locked</span>
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {course.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{course.faculty}</p>

                    {/* Progress Bar */}
                    {course.isEnrolled ? (
                      <div className="mt-3 max-w-md">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-500 dark:text-slate-400">
                            Lectures: {course.attendedLectures} / {course.totalLectures}
                          </span>
                          <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{course.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-2 italic">
                        Course entitlement rule: Contact administrator to unlock syllabus modules.
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0 w-full sm:w-auto">
                    {course.isEnrolled ? (
                      <button
                        onClick={() => onNavigateTab('learning')}
                        className="w-full sm:w-auto justify-center px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/30 text-xs font-semibold transition-all text-center block cursor-pointer active:scale-95"
                      >
                        Enter Course
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold px-3 py-1.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center block">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Today & Upcoming Classes Timetable */}
          <GlassCard variant="default" padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-slate-200/60 dark:border-white/5">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Academic Timetable & Live Lectures
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg self-start sm:self-center border border-indigo-200/60 dark:border-indigo-500/30">
                Today: {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {upcomingClasses.map((cls) => (
                <div
                  key={cls.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    cls.isLiveNow
                      ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/40 ring-1 ring-rose-500/20'
                      : 'bg-white/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-white/5 hover:border-indigo-400/50'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-700 text-white">
                        {cls.time}
                      </span>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{cls.type}</span>
                      {cls.isLiveNow && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Happening Now</span>
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {cls.subject}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Faculty: <strong className="text-slate-700 dark:text-slate-300">{cls.faculty}</strong> • Venue: {cls.room}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 w-full sm:w-auto">
                    {cls.joinLink ? (
                      <Link
                        href={`/live-stream?title=${encodeURIComponent(cls.subject)}&role=student`}
                        className="w-full sm:w-auto justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-rose-500/20 active:scale-95 transition-all"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Live Hall</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => onNavigateTab('learning')}
                        className="w-full sm:w-auto justify-center px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        View Syllabus
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Recorded Live Masterclasses (VOD Archive) */}
          <GlassCard variant="default" padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-slate-200/60 dark:border-white/5">
              <div className="flex items-center space-x-2">
                <PlayCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Recorded Live Masterclasses (VOD Library)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Instant access to recorded faculty lectures after live streaming concludes
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg self-start sm:self-center border border-indigo-200/60 dark:border-indigo-500/30">
                {recordedLectures.length} Recorded Sessions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {recordedLectures.length > 0 ? (
                recordedLectures.map((lec) => (
                  <div
                    key={lec.id}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 hover:border-indigo-400/60 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-700 text-white font-bold">
                          VOD RECORDING
                        </span>
                        <span>{lec.duration || 'Full Session'}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {lec.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Faculty: <strong className="text-slate-700 dark:text-slate-200">{lec.faculty}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Streamed on {lec.date}
                      </p>
                    </div>

                    <Link
                      href={`/live-stream?title=${encodeURIComponent(lec.title)}&role=student`}
                      className="mt-4 w-full py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white border border-indigo-200/60 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Watch Recording Now</span>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  No recorded lectures archived yet. When faculty finishes a live class, the video recording will appear here automatically.
                </div>
              )}
            </div>
          </GlassCard>

        </div>

        {/* Right Column (1 span): Notifications, Live Tests Card, Fee Status Alert */}
        <div className="space-y-6 sm:space-y-7">
          
          {/* Notifications & Circulars Tile */}
          <GlassCard variant="default" padding="lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/5">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Official Notices
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Live Broadcast</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/5 mt-2 space-y-2">
              {activeLiveStream?.isLive && (
                <div className="pt-2.5 pb-2 bg-rose-50/60 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200/60 dark:border-rose-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span>LIVE NOW</span>
                    </span>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">Ongoing</span>
                  </div>
                  <h5 className="text-xs font-bold text-rose-700 dark:text-rose-300 mt-1.5 leading-snug">
                    Live Broadcast Started: {activeLiveStream.teacherName || 'Dr. Ekta Gahlawat'}
                  </h5>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-normal">
                    {activeLiveStream.courseTitle || 'Faculty is live streaming for your enrolled cohort.'}
                  </p>
                  <Link
                    href={`/live-stream?title=${encodeURIComponent(activeLiveStream.courseTitle || 'Live Lecture')}&role=student`}
                    className="mt-2 inline-flex items-center space-x-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    <span>Click here to join class →</span>
                  </Link>
                </div>
              )}
              {notifications.map((n) => (
                <div key={n.id} className="pt-2.5 pb-1">
                  <div className="flex items-start justify-between">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{n.title}</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">{n.message}</p>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium block mt-1">{n.date}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Timed Test Diagnostic Callout */}
          {availableTest && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 text-white shadow-xl relative overflow-hidden border border-indigo-400/30">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <span className="text-[10px] font-mono tracking-widest text-indigo-200 uppercase font-bold block">
                  Diagnostic Assessment Ready
                </span>
                <h4 className="text-lg font-bold text-white mt-1">
                  {availableTest.title}
                </h4>
                <p className="text-xs text-white/80 mt-1">
                  Duration: {availableTest.durationMinutes} mins • {availableTest.totalQuestions} Questions • Real-time scoring
                </p>

                <button
                  onClick={() => onStartTest(availableTest)}
                  className="mt-4 w-full py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Start Timed Test Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Fee Status Summary Card */}
          <GlassCard variant="default" padding="lg">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Institutional Fee Summary
              </h4>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/5">
                <span className="text-slate-500 dark:text-slate-400">Total Course Fee:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹{((student as any).totalFee || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/5">
                <span className="text-slate-500 dark:text-slate-400">Total Paid (Receipted):</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{((student as any).paidFee || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/5">
                <span className="text-slate-500 dark:text-slate-400">Pending Balance:</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  ₹{((student as any).dueFee || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 dark:text-slate-400">Next Installment Due:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {(student as any).nextDueDate || ((student as any).dueFee ? 'On Demand' : 'None (Cleared ✓)')}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('fees')}
              className="mt-4 w-full py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white text-xs font-semibold transition-all cursor-pointer active:scale-95"
            >
              View Payment Ledger & Receipts →
            </button>
          </GlassCard>

        </div>

      </div>
    </div>
  );
}
