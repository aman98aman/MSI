'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Video,
  Plus,
  Calendar,
  Users,
  Clock,
  Sparkles,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import {
  CommunicationPost,
  OneToOneSession,
  TeacherCourse,
  StudentMonitoringRecord,
} from './data/teacherMockData';
import GlassCard from '../glass/GlassCard';

interface TeacherCommunicationTabProps {
  posts: CommunicationPost[];
  oneToOneSessions: OneToOneSession[];
  courses: TeacherCourse[];
  students: StudentMonitoringRecord[];
  stream: 'Law' | 'JEE';
  onAddPost: (post: CommunicationPost) => void;
  onOpenScheduleOneToOne: () => void;
}

export default function TeacherCommunicationTab({
  posts,
  oneToOneSessions,
  courses,
  students,
  stream,
  onAddPost,
  onOpenScheduleOneToOne,
}: TeacherCommunicationTabProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [postType, setPostType] = useState<'Announcement' | 'Class Update' | 'Resource Note'>('Announcement');
  const [targetCourse, setTargetCourse] = useState(courses[0]?.code || '');

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    const newPost: CommunicationPost = {
      id: `comm-gen-${Date.now()}`,
      title: newTitle,
      message: newMessage,
      courseCode: targetCourse,
      stream,
      author: 'Faculty Member',
      date: 'Just now',
      type: postType,
    };

    onAddPost(newPost);
    setNewTitle('');
    setNewMessage('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with 1-on-1 Meet CTA */}
      <GlassCard variant="elevated" className="p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-200/50 dark:border-white/10">
          <div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-[#89190E] dark:text-[#EFC988]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Faculty Broadcasts & 1-on-1 Mentorship
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Dispatch real-time announcements to your batches and schedule individual remedial doubt clearing sessions.
            </p>
          </div>

          <button
            onClick={onOpenScheduleOneToOne}
            className="px-5 py-2.5 rounded-xl bg-linear-to-r from-[#89190E] to-[#B22222] hover:opacity-95 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-[#89190E]/20 active:scale-98 transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-[#EFC988]" />
            <span>Schedule 1-on-1 Meet</span>
          </button>
        </div>
      </GlassCard>

      {/* 2. Main 2-Column: Create Broadcast + Active 1-on-1 Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Spans: Post Announcement + Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Broadcast Form */}
          <GlassCard variant="elevated" className="p-6">
            <h3 className="font-serif text-base font-bold text-gray-900 dark:text-white mb-3">
              Broadcast New Announcement or Class Update
            </h3>

            <form onSubmit={handlePostSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Select Target Course
                  </label>
                  <select
                    value={targetCourse}
                    onChange={(e) => setTargetCourse(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 font-semibold text-gray-800 dark:text-gray-200 focus:outline-none"
                  >
                    {courses.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.batch})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Notice Category
                  </label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value as typeof postType)}
                    className="w-full p-2.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 font-semibold text-gray-800 dark:text-gray-200 focus:outline-none"
                  >
                    <option value="Announcement">General Announcement</option>
                    <option value="Class Update">Class & Timetable Update</option>
                    <option value="Resource Note">Resource Note / Reading Hint</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Landmark Judgment Reading List for Friday Moot Session"
                  className="w-full p-2.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 font-semibold text-xs sm:text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#89190E] dark:focus:border-[#EFC988]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Message Details *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type official notice details sent to student terminals..."
                  className="w-full p-2.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#89190E] dark:focus:border-[#EFC988]"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-linear-to-r from-[#89190E] to-[#B22222] hover:opacity-95 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-[#89190E]/20 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish to Student Feed</span>
                </button>
              </div>
            </form>
          </GlassCard>

          {/* Broadcast Feed */}
          <GlassCard variant="elevated" className="p-6">
            <h3 className="font-serif text-base font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-200/50 dark:border-white/10">
              Active Broadcast Stream ({posts.length})
            </h3>

            <div className="divide-y divide-gray-200/40 dark:divide-white/10 space-y-4 mt-2">
              {posts.map((post) => (
                <div key={post.id} className="pt-4 first:pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#89190E]/10 dark:bg-[#89190E]/20 text-[#89190E] dark:text-[#EFC988]">
                      {post.type} • {post.courseCode}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{post.date}</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                    {post.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{post.message}</p>
                  <p className="text-[10px] text-[#89190E] dark:text-[#EFC988] font-medium">Author: {post.author}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right Column: One-to-One Scheduled Mentorship Sessions */}
        <div className="space-y-6">
          <GlassCard variant="elevated" className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200/50 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#89190E] dark:text-[#EFC988]" />
                <h3 className="font-serif text-base font-bold text-gray-900 dark:text-white">
                  1-on-1 Mentorship Meets
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#89190E] dark:text-[#EFC988]">
                {oneToOneSessions.length} Scheduled
              </span>
            </div>

            <div className="space-y-3.5 mt-4">
              {oneToOneSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-sm text-gray-900 dark:text-white">
                        {session.studentName}
                      </h4>
                      <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                        Roll: {session.studentRoll}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      {session.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <strong className="text-gray-700 dark:text-gray-300">Topic:</strong> {session.topic}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/50 dark:border-white/10 text-xs">
                    <span className="font-mono text-gray-800 dark:text-gray-200 text-[11px]">
                      {session.date}, {session.time}
                    </span>
                    <a
                      href={session.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-linear-to-r from-[#89190E] to-[#B22222] hover:opacity-95 text-white text-[10px] font-bold flex items-center space-x-1 shadow-xs cursor-pointer"
                    >
                      <Video className="w-3 h-3" />
                      <span>Start Meet</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onOpenScheduleOneToOne}
              className="mt-4 w-full py-2.5 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-[#89190E] hover:text-white dark:hover:bg-[#EFC988] dark:hover:text-gray-950 text-[#89190E] dark:text-[#EFC988] border border-gray-200/80 dark:border-white/10 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              + Book Another Student Meet
            </button>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
