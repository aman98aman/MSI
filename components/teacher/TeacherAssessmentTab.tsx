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
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8DCCB] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E8DCCB]">
          <div>
            <div className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-[#89190E]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#10233F]">
                Assessment & Examination Engine
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#526174] mt-1">
              Construct high-yield mock tests, author question banks, map official answer keys, and set marking rules.
            </p>
          </div>

          <button
            onClick={onOpenCreateTest}
            className="px-5 py-2.5 rounded-xl bg-[#89190E] hover:bg-[#65130D] text-white text-xs font-bold flex items-center space-x-2 shadow-md shadow-[#89190E]/20 active:scale-98 transition-all"
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                subView === tab.id
                  ? 'bg-[#10233F] text-white shadow-xs'
                  : 'bg-[#FFF9EF] text-[#526174] hover:text-[#10233F]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    subView === tab.id ? 'bg-white/20 text-white' : 'bg-[#E8DCCB] text-[#526174]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Active Assessments View */}
      {subView === 'tests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {assessments.map((asmt) => (
            <div
              key={asmt.id}
              className="p-6 rounded-3xl border border-[#E8DCCB] hover:border-[#89190E] transition-all bg-white flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md ${
                      asmt.type === 'Mock'
                        ? 'bg-[#FFF3DD] text-[#89190E]'
                        : 'bg-[#10233F] text-white'
                    }`}
                  >
                    {asmt.type} Assessment
                  </span>

                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      asmt.status === 'Published'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    ● {asmt.status}
                  </span>
                </div>

                <h3 className="font-serif text-base sm:text-lg font-bold text-[#10233F] mt-3 leading-snug">
                  {asmt.title}
                </h3>
                <p className="text-xs text-[#526174] mt-1">Course: {asmt.courseCode}</p>

                <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-2xl bg-[#FFF9EF] border border-[#E8DCCB] text-center text-xs">
                  <div>
                    <span className="text-[10px] text-[#526174] uppercase block">Duration</span>
                    <span className="font-mono font-bold text-[#10233F]">{asmt.durationMinutes} Mins</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#526174] uppercase block">Questions</span>
                    <span className="font-mono font-bold text-[#10233F]">{asmt.totalQuestions} Qs</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#526174] uppercase block">Max Marks</span>
                    <span className="font-mono font-bold text-[#89190E]">{asmt.marks}</span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-[#526174]">
                  Rule: <strong>{asmt.negativeMarking}</strong>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E8DCCB] flex items-center justify-between">
                <span className="text-xs text-[#526174]">
                  Submissions: <strong>{asmt.submissionsCount} Students</strong>
                </span>
                <button
                  onClick={() => alert(`Reviewing submissions and answer matrix for ${asmt.title}...`)}
                  className="text-xs font-bold text-[#89190E] hover:underline"
                >
                  Inspect Score Distribution →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Question Bank View */}
      {subView === 'qbank' && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8DCCB] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DCCB]">
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#10233F]">
                Institutional Question Bank Repository
              </h3>
              <p className="text-xs text-[#526174]">Curated by Senior Faculty Bench</p>
            </div>
            <button
              onClick={() => alert('New Question Authoring Dialog...')}
              className="px-3.5 py-1.5 rounded-xl bg-[#10233F] text-white text-xs font-bold"
            >
              + Author Question
            </button>
          </div>

          <div className="space-y-3">
            {sampleQuestionBank.map((q) => (
              <div key={q.id} className="p-4 rounded-2xl bg-[#FFF9EF]/40 border border-[#E8DCCB] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#89190E]">{q.subject}</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border text-[10px] font-bold text-[#10233F]">
                    {q.difficulty} • +{q.marks} Marks
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#10233F]">{q.question}</p>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs">
                  <strong>Verified Correct Solution:</strong> {q.correctOption}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Official Answer Keys View */}
      {subView === 'keys' && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8DCCB] shadow-xs">
          <h3 className="font-serif text-base sm:text-lg font-bold text-[#10233F] pb-3 border-b border-[#E8DCCB]">
            Official Answer Keys & Bare Act Rationale Mappings
          </h3>
          <p className="text-xs text-[#526174] mt-3">
            Each published question is mapped to statutory Bare Act provisions and high court citations. Students see these rationales upon test submission.
          </p>
          <div className="mt-4 p-4 rounded-2xl bg-[#FFF9EF] border border-[#E8DCCB] text-xs space-y-2">
            <p><strong>Set #12 Judiciary Key:</strong> Published with 25 Verified Ratio Decidendi Explanations.</p>
            <p><strong>Mid-Term V Key:</strong> Draft pending Dean of Examinations final countersign.</p>
          </div>
        </div>
      )}

      {/* 5. Marks & Timing Rules View */}
      {subView === 'rules' && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8DCCB] shadow-xs">
          <h3 className="font-serif text-base sm:text-lg font-bold text-[#10233F] pb-3 border-b border-[#E8DCCB]">
            Marks & Timing Statutory Evaluation Guidelines
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#E8DCCB]">
              <span className="font-bold text-[#89190E] block uppercase">Standard Preliminary Marking</span>
              <p className="mt-1 text-[#10233F]">+4 for correct, -1 for incorrect, 0 for unattempted.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#E8DCCB]">
              <span className="font-bold text-[#89190E] block uppercase">Time Buffer Policy</span>
              <p className="mt-1 text-[#10233F]">Automatic lockdown occurs upon timer expiration with grace period of 60 seconds.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#E8DCCB]">
              <span className="font-bold text-[#89190E] block uppercase">Percentile Computation</span>
              <p className="mt-1 text-[#10233F]">Normalized against the entire enrolled cohort using official judicial standards.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
