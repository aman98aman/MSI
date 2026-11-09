'use client';

import React, { useState } from 'react';
import {
  FileCheck,
  Plus,
  Clock,
  Award,
  CheckCircle2,
  HelpCircle,
  Settings,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { AssessmentItem, TeacherCourse } from './data/teacherMockData';
import GlassCard from '../glass/GlassCard';

interface TeacherAssessmentTabProps {
  assessments: AssessmentItem[];
  courses: TeacherCourse[];
  stream: 'Law' | 'JEE';
  onOpenCreateTest: () => void;
}

export default function TeacherAssessmentTab({
  assessments,
  courses,
  stream,
  onOpenCreateTest,
}: TeacherAssessmentTabProps) {
  const [subView, setSubView] = useState<'tests' | 'qbank' | 'keys' | 'rules'>('tests');

  // Sample Question Bank entries
  const sampleQuestionBank = [
    {
      id: 1,
      question: 'Which constitutional amendment introduced Article 21A guaranteeing the right to education?',
      subject: 'Constitutional Law',
      difficulty: 'Medium',
      marks: 4,
      correctOption: '86th Amendment Act, 2002',
    },
    {
      id: 2,
      question: 'Under Section 164 of the CrPC, who is empowered to record confessions and statements?',
      subject: 'Code of Criminal Procedure',
      difficulty: 'High',
      marks: 4,
      correctOption: 'Any Metropolitan Magistrate or Judicial Magistrate',
    },
    {
      id: 3,
      question: 'What is the standard limitation period for filing an appeal to the High Court under Section 374 CrPC?',
      subject: 'Criminal Appeals',
      difficulty: 'Medium',
      marks: 4,
      correctOption: '60 days from sentence date',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header with Assessment Sub-navigation */}
      <GlassCard variant="elevated" className="p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-200/50 dark:border-white/10">
          <div>
            <div className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-[#89190E] dark:text-[#EFC988]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Assessment & Examination Engine
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Construct high-yield mock tests, author question banks, map official answer keys, and set marking rules.
            </p>
          </div>

          <button
            onClick={onOpenCreateTest}
            className="px-5 py-2.5 rounded-xl bg-linear-to-r from-[#89190E] to-[#B22222] hover:opacity-95 text-white text-xs font-bold flex items-center space-x-2 shadow-md shadow-[#89190E]/20 active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Test / Mock</span>
          </button>
        </div>

        {/* Sub-Tabs: Tests, Question Bank, Answer Key, Marks/Time Rules */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {[
            { id: 'tests', label: 'Active Assessments', count: assessments.length },
            { id: 'qbank', label: 'Question Bank Repository', count: sampleQuestionBank.length },
            { id: 'keys', label: 'Official Answer Keys & Solutions' },
            { id: 'rules', label: 'Marks & Timing Rules' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubView(tab.id as typeof subView)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                subView === tab.id
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-950 shadow-xs'
                  : 'bg-white/60 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200/60 dark:border-white/10'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    subView === tab.id
                      ? 'bg-white/20 text-white dark:bg-gray-950/20 dark:text-gray-950'
                      : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* 2. Active Assessments View */}
      {subView === 'tests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {assessments.map((asmt) => (
            <GlassCard
              key={asmt.id}
              variant="interactive"
              className="p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md ${
                      asmt.type === 'Mock'
                        ? 'bg-[#89190E]/10 dark:bg-[#89190E]/20 text-[#89190E] dark:text-[#EFC988]'
                        : 'bg-gray-900 text-white dark:bg-white/20'
                    }`}
                  >
                    {asmt.type} Assessment
                  </span>

                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      asmt.status === 'Published'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-gray-200/60 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    ● {asmt.status}
                  </span>
                </div>

                <h3 className="font-serif text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-3 leading-snug">
                  {asmt.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Course: {asmt.courseCode}</p>

                <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase block">Duration</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">{asmt.durationMinutes} Mins</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase block">Questions</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">{asmt.totalQuestions} Qs</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase block">Max Marks</span>
                    <span className="font-mono font-bold text-[#89190E] dark:text-[#EFC988]">{asmt.marks}</span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">
                  Rule: <strong className="text-gray-700 dark:text-gray-300">{asmt.negativeMarking}</strong>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Submissions: <strong className="text-gray-800 dark:text-gray-200">{asmt.submissionsCount} Students</strong>
                </span>
                <button
                  onClick={() => alert(`Reviewing submissions and answer matrix for ${asmt.title}...`)}
                  className="text-xs font-bold text-[#89190E] dark:text-[#EFC988] hover:underline cursor-pointer"
                >
                  Inspect Score Distribution →
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* 3. Question Bank View */}
      {subView === 'qbank' && (
        <GlassCard variant="elevated" className="p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200/50 dark:border-white/10">
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Institutional Question Bank Repository
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Curated by Senior Faculty Bench</p>
            </div>
            <button
              onClick={() => alert('New Question Authoring Dialog...')}
              className="px-3.5 py-1.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-950 text-xs font-bold cursor-pointer"
            >
              + Author Question
            </button>
          </div>

          <div className="space-y-3">
            {sampleQuestionBank.map((q) => (
              <div key={q.id} className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#89190E] dark:text-[#EFC988]">{q.subject}</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-white/10 border border-gray-200/60 dark:border-white/10 text-[10px] font-bold text-gray-800 dark:text-gray-200">
                    {q.difficulty} • +{q.marks} Marks
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{q.question}</p>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-xs">
                  <strong>Verified Correct Solution:</strong> {q.correctOption}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* 4. Official Answer Keys View */}
      {subView === 'keys' && (
        <GlassCard variant="elevated" className="p-6 sm:p-7">
          <h3 className="font-serif text-base sm:text-lg font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-200/50 dark:border-white/10">
            Official Answer Keys & Bare Act Rationale Mappings
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Each published question is mapped to statutory Bare Act provisions and high court citations. Students see these rationales upon test submission.
          </p>
          <div className="mt-4 p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-xs space-y-2 text-gray-700 dark:text-gray-300">
            <p><strong>Set #12 Judiciary Key:</strong> Published with 25 Verified Ratio Decidendi Explanations.</p>
            <p><strong>Mid-Term V Key:</strong> Draft pending Dean of Examinations final countersign.</p>
          </div>
        </GlassCard>
      )}

      {/* 5. Marks & Timing Rules View */}
      {subView === 'rules' && (
        <GlassCard variant="elevated" className="p-6 sm:p-7">
          <h3 className="font-serif text-base sm:text-lg font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-200/50 dark:border-white/10">
            Marks & Timing Statutory Evaluation Guidelines
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
              <span className="font-bold text-[#89190E] dark:text-[#EFC988] block uppercase">Standard Preliminary Marking</span>
              <p className="mt-1 text-gray-800 dark:text-gray-200">+4 for correct, -1 for incorrect, 0 for unattempted.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
              <span className="font-bold text-[#89190E] dark:text-[#EFC988] block uppercase">Time Buffer Policy</span>
              <p className="mt-1 text-gray-800 dark:text-gray-200">Automatic lockdown occurs upon timer expiration with grace period of 60 seconds.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
              <span className="font-bold text-[#89190E] dark:text-[#EFC988] block uppercase">Percentile Computation</span>
              <p className="mt-1 text-gray-800 dark:text-gray-200">Normalized against the entire enrolled cohort using official judicial standards.</p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
