'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  Video,
  Radio,
  Plus,
  MapPin,
  CheckCircle2,
  Users,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import TeacherLiveStreamStudio from './TeacherLiveStreamStudio';
import {
  TeacherClassSchedule,
  TeacherCourse,
  StudentMonitoringRecord,
} from './data/teacherMockData';
import GlassCard from '../glass/GlassCard';

interface TeacherClassesTabProps {
  schedules: TeacherClassSchedule[];
  courses: TeacherCourse[];
  students: StudentMonitoringRecord[];
  stream: 'Law' | 'JEE';
  onOpenScheduleClass: () => void;
  onLaunchAttendance: (session: TeacherClassSchedule) => void;
}

export default function TeacherClassesTab({
  schedules,
  courses,
  students,
  stream,
  onOpenScheduleClass,
  onLaunchAttendance,
}: TeacherClassesTabProps) {
  const [isStreamStudioOpen, setIsStreamStudioOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* 1. Header with Schedule Class & Bunny Live Studio CTA */}
      <GlassCard variant="elevated" className="p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-200/50 dark:border-white/10">
          <div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-[#89190E] dark:text-[#EFC988]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Lectures, Smart Moot Sessions & Timetable
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Schedule physical lectures, initialize live Bunny.net video streaming broadcasts, and take daily electronic attendance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsStreamStudioOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white/10 hover:bg-gray-800 dark:hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-2 shadow-md active:scale-98 transition-all cursor-pointer border border-white/10"
            >
              <Radio className="w-4 h-4 text-[#EFC988] animate-pulse" />
              <span>Bunny.net Live Studio</span>
            </button>

            <button
              onClick={onOpenScheduleClass}
              className="px-5 py-2.5 rounded-xl bg-linear-to-r from-[#89190E] to-[#B22222] hover:opacity-95 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-[#89190E]/20 active:scale-98 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Class</span>
            </button>
          </div>
        </div>

        {/* Course / Subject Mapping Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
          <span className="font-bold text-gray-500 dark:text-gray-400">Active Course Mappings:</span>
          {courses.map((c) => (
            <span
              key={c.code}
              className="px-3 py-1 rounded-xl bg-white/60 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-gray-800 dark:text-gray-200 font-semibold shadow-2xs"
            >
              <strong className="text-[#89190E] dark:text-[#EFC988]">{c.code}:</strong> {c.batch} ({c.totalStudents} Students)
            </span>
          ))}
        </div>
      </GlassCard>

      {/* 2. Scheduled Sessions List */}
      <GlassCard variant="elevated" className="p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200/50 dark:border-white/10">
          <h3 className="font-serif text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            Scheduled Class Sessions & Attendance Registers ({schedules.length})
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">Synced with Institute Timetable</span>
        </div>

        <div className="space-y-4 mt-4">
          {schedules.map((session) => (
            <div
              key={session.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                session.isLiveNow
                  ? 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600/50 ring-1 ring-amber-400/30'
                  : 'bg-white/60 dark:bg-white/5 border-gray-200/60 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/20'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-gray-900 text-white dark:bg-white/20">
                    {session.time}
                  </span>
                  <span className="text-xs font-semibold text-[#89190E] dark:text-[#EFC988]">{session.type}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">• {session.day}</span>
                  {session.isLiveNow && (
                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Active Now
                    </span>
                  )}
                </div>

                <h4 className="font-serif font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                  {session.subject}
                </h4>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    Course: <strong className="text-gray-700 dark:text-gray-200">{session.courseCode}</strong> ({session.batch})
                  </span>
                  <span>•</span>
                  <span>Venue: {session.venue}</span>
                  {session.meetLink && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                        <Video className="w-3 h-3" />
                        <span>Google Meet Enabled</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => onLaunchAttendance(session)}
                  className="px-4 py-2 rounded-xl bg-white/80 dark:bg-white/10 border border-[#89190E]/60 dark:border-[#EFC988]/60 text-[#89190E] dark:text-[#EFC988] hover:bg-[#89190E] hover:text-white dark:hover:bg-[#EFC988] dark:hover:text-gray-950 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Mark Daily Attendance
                </button>

                <button
                  onClick={() => setIsStreamStudioOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gray-900 dark:bg-white/10 hover:bg-gray-800 dark:hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer border border-white/10"
                  title="Initialize or manage Bunny.net live video stream"
                >
                  <Radio className="w-3.5 h-3.5 text-[#EFC988]" />
                  <span>Bunny Stream</span>
                </button>

                {session.meetLink && (
                  <a
                    href={session.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-linear-to-r from-[#89190E] to-[#B22222] hover:opacity-95 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 text-[#EFC988]" />
                    <span>Start Video Call</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Bunny.net Stream Studio Modal */}
      <TeacherLiveStreamStudio
        isOpen={isStreamStudioOpen}
        onClose={() => setIsStreamStudioOpen(false)}
        stream={stream}
      />
    </div>
  );
}
