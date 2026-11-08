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
} from 'lucide-react';
import TeacherLiveStreamStudio from './TeacherLiveStreamStudio';
import {
  TeacherClassSchedule,
  TeacherCourse,
  StudentMonitoringRecord,
} from './data/teacherMockData';

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
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8DCCB] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E8DCCB]">
          <div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-[#89190E]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#10233F]">
                Lectures, Smart Moot Sessions & Timetable
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#526174] mt-1">
              Schedule physical lectures, initialize live Bunny.net video streaming broadcasts, and take daily electronic attendance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsStreamStudioOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#10233F] hover:bg-[#1a345c] text-white text-xs font-bold flex items-center space-x-2 shadow-md shadow-[#10233F]/20 active:scale-98 transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 text-[#EFC988] animate-pulse" />
              <span>Bunny.net Live Studio</span>
            </button>

            <button
              onClick={onOpenScheduleClass}
              className="px-5 py-2.5 rounded-xl bg-[#89190E] hover:bg-[#65130D] text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-[#89190E]/20 active:scale-98 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Class</span>
            </button>
          </div>
        </div>

        {/* Course / Subject Mapping Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
          <span className="font-bold text-[#526174]">Active Course Mappings:</span>
          {courses.map((c) => (
            <span
              key={c.code}
              className="px-3 py-1 rounded-xl bg-[#FFF9EF] border border-[#E8DCCB] text-[#10233F] font-semibold"
            >
              <strong>{c.code}:</strong> {c.batch} ({c.totalStudents} Students)
            </span>
          ))}
        </div>
      </div>

      {/* 2. Scheduled Sessions List */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8DCCB] shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DCCB]">
          <h3 className="font-serif text-base sm:text-lg font-bold text-[#10233F]">
            Scheduled Class Sessions & Attendance Registers ({schedules.length})
          </h3>
          <span className="text-xs text-[#526174]">Synced with Institute Timetable</span>
        </div>

        <div className="space-y-4 mt-4">
          {schedules.map((session) => (
            <div
              key={session.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                session.isLiveNow
                  ? 'bg-[#FFF9EF] border-[#89190E] ring-1 ring-[#89190E]/20'
                  : 'bg-white border-[#E8DCCB] hover:border-[#10233F]'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#10233F] text-white">
                    {session.time}
                  </span>
                  <span className="text-xs font-semibold text-[#89190E]">{session.type}</span>
                  <span className="text-xs text-[#526174]">• {session.day}</span>
                  {session.isLiveNow && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full animate-pulse">
                      ● Active Now
                    </span>
                  )}
                </div>

                <h4 className="font-serif font-bold text-base sm:text-lg text-[#10233F]">
                  {session.subject}
                </h4>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#526174]">
                  <span>
                    Course: <strong>{session.courseCode}</strong> ({session.batch})
                  </span>
                  <span>•</span>
                  <span>Venue: {session.venue}</span>
                  {session.meetLink && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold flex items-center space-x-1">
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
                  className="px-4 py-2 rounded-xl bg-white border border-[#89190E] text-[#89190E] hover:bg-[#FFF9EF] text-xs font-bold transition-all shadow-xs"
                >
                  Mark Daily Attendance
                </button>

                <button
                  onClick={() => setIsStreamStudioOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#10233F] hover:bg-[#1a345c] text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
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
                    className="px-4 py-2 rounded-xl bg-[#89190E] hover:bg-[#65130D] text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5 text-[#EFC988]" />
                    <span>Start Video Call</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bunny.net Stream Studio Modal */}
      <TeacherLiveStreamStudio
        isOpen={isStreamStudioOpen}
        onClose={() => setIsStreamStudioOpen(false)}
        stream={stream}
      />
    </div>
  );
}
