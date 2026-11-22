'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ClipboardList,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Clock,
  Award,
  Calendar,
  Layers,
  Search,
  BookOpen,
  HelpCircle,
  Upload,
} from 'lucide-react';
import GlassCard from '../glass/GlassCard';
import { MSICourse } from '@/lib/lmsStore';
import * as XLSX from 'xlsx';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface LMSTest {
  id: string;
  title: string;
  instructions: string;
  courseId: string;
  courseName: string;
  questions: Question[];
  questionsPerStudent: number;
  durationMinutes: number;
  marksPerQuestion: number;
  negativeMarking: number;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  uploadedBy: string;
  uploadedById: string;
  createdAt: string;
}

interface TeacherTestsTabProps {
  lmsCourses: MSICourse[];
  teacherId: string;
  teacherName: string;
}

export default function TeacherTestsTab({
  lmsCourses = [],
  teacherId,
  teacherName,
}: TeacherTestsTabProps) {
  const [tests, setTests] = useState<LMSTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('All');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTestForDelete, setActiveTestForDelete] = useState<LMSTest | null>(null);
  const [activeTestForDetail, setActiveTestForDetail] = useState<LMSTest | null>(null);

  // Form states for test creation
  const [testTitle, setTestTitle] = useState('');
  const [testInstructions, setTestInstructions] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [questionsPerStudent, setQuestionsPerStudent] = useState(15);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Questions builder
  const [questionsBank, setQuestionsBank] = useState<Question[]>([]);
  const [manualQuestionText, setManualQuestionText] = useState('');
  const [manualOptionA, setManualOptionA] = useState('');
  const [manualOptionB, setManualOptionB] = useState('');
  const [manualOptionC, setManualOptionC] = useState('');
  const [manualOptionD, setManualOptionD] = useState('');
  const [manualCorrectAnswer, setManualCorrectAnswer] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch tests from server
  const fetchTests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/lms/tests?teacherId=${encodeURIComponent(teacherId || '')}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.tests)) {
        setTests(data.tests);
      } else {
        setTests([]);
      }
    } catch (err) {
      console.error('[Teacher Tests] Error fetching tests:', err);
      setTests([]);
    } finally {
      setIsLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // Set default course selection
  useEffect(() => {
    if (lmsCourses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(lmsCourses[0].id);
    }
  }, [lmsCourses, selectedCourseId]);

  // Add a single question manually to the bank
  const handleAddManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuestionText.trim()) return;
    if (!manualOptionA.trim() || !manualOptionB.trim() || !manualOptionC.trim() || !manualOptionD.trim()) {
      setFormError('Please fill in all 4 options for the question.');
      return;
    }

    const newQ: Question = {
      id: `q-${Date.now()}-${questionsBank.length + 1}`,
      text: manualQuestionText.trim(),
      options: [manualOptionA.trim(), manualOptionB.trim(), manualOptionC.trim(), manualOptionD.trim()],
      correctAnswer: manualCorrectAnswer,
    };

    setQuestionsBank((prev) => [...prev, newQ]);
    setManualQuestionText('');
    setManualOptionA('');
    setManualOptionB('');
    setManualOptionC('');
    setManualOptionD('');
    setManualCorrectAnswer(0);
    setFormError('');
  };

  // Excel / CSV Import handler
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const importedQuestions: Question[] = [];
        data.forEach((row, idx) => {
          const qText = row.Question || row.question || row.text || row.Query || '';
          const optA = row.OptionA || row['Option A'] || row.optA || row.A || '';
          const optB = row.OptionB || row['Option B'] || row.optB || row.B || '';
          const optC = row.OptionC || row['Option C'] || row.optC || row.C || '';
          const optD = row.OptionD || row['Option D'] || row.optD || row.D || '';
          const correct = row.CorrectAnswer || row.Correct || row.Answer || 'A';

          if (qText && optA && optB) {
            let correctIdx = 0;
            const cStr = String(correct).trim().toUpperCase();
            if (cStr === 'B' || cStr === '2') correctIdx = 1;
            else if (cStr === 'C' || cStr === '3') correctIdx = 2;
            else if (cStr === 'D' || cStr === '4') correctIdx = 3;

            importedQuestions.push({
              id: `q-imp-${Date.now()}-${idx + 1}`,
              text: String(qText).trim(),
              options: [String(optA).trim(), String(optB).trim(), String(optC || 'N/A').trim(), String(optD || 'N/A').trim()],
              correctAnswer: correctIdx,
            });
          }
        });

        if (importedQuestions.length > 0) {
          setQuestionsBank((prev) => [...prev, ...importedQuestions]);
          showToast(`Imported ${importedQuestions.length} questions from Excel!`);
        } else {
          setFormError('No valid questions found in Excel file. Expected columns: Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer.');
        }
      } catch (err: any) {
        setFormError('Failed to parse Excel file: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Create Test Submit
  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!testTitle.trim()) {
      setFormError('Please enter test title.');
      return;
    }
    if (!selectedCourseId) {
      setFormError('Please select an assigned course.');
      return;
    }
    if (questionsBank.length === 0) {
      setFormError('Please add at least one question to the question bank.');
      return;
    }
    if (questionsPerStudent > questionsBank.length) {
      setFormError(`Questions per student (${questionsPerStudent}) cannot exceed total question bank size (${questionsBank.length}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const courseName = lmsCourses.find((c) => c.id === selectedCourseId)?.title || 'Judiciary Foundation';

      const payload = {
        title: testTitle.trim(),
        instructions: testInstructions.trim() || 'All questions are compulsory. Ensure strict exam compliance.',
        courseId: selectedCourseId,
        courseName,
        questions: questionsBank,
        questionsPerStudent: Number(questionsPerStudent) || questionsBank.length,
        durationMinutes: Number(durationMinutes) || 30,
        marksPerQuestion: Number(marksPerQuestion) || 1,
        negativeMarking: Number(negativeMarking) || 0,
        startDate: startDate || new Date().toISOString(),
        endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isPublished: true,
        uploadedBy: teacherName || 'Faculty',
        uploadedById: teacherId || 'fac-default',
      };

      const res = await fetch('/api/lms/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        showToast('Online test created and question bank saved successfully!');
        setShowCreateModal(false);
        setTestTitle('');
        setTestInstructions('');
        setQuestionsBank([]);
        fetchTests();
      } else {
        throw new Error(data.message || 'Failed to save test.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error creating test.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle publish
  const handleTogglePublish = async (test: LMSTest) => {
    try {
      const res = await fetch('/api/lms/tests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: test.id,
          updates: { isPublished: !test.isPublished },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Test ${test.isPublished ? 'set to Draft (hidden from students)' : 'Published for enrolled students'}!`);
        fetchTests();
      }
    } catch (err) {
      console.error('Error toggling test publish:', err);
    }
  };

  // Delete test
  const handleDeleteTest = async () => {
    if (!activeTestForDelete) return;
    try {
      const res = await fetch(`/api/lms/tests?id=${encodeURIComponent(activeTestForDelete.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Test and question bank permanently removed.');
        setShowDeleteModal(false);
        setActiveTestForDelete(null);
        fetchTests();
      } else {
        showToast(data.message || 'Failed to delete test.');
      }
    } catch (err) {
      console.error('Error deleting test:', err);
    }
  };

  // Filter tests
  const filteredTests = tests.filter((t) => {
    if (selectedCourseFilter !== 'All' && t.courseId !== selectedCourseFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.courseName.toLowerCase().includes(q) ||
        t.instructions.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-gray-900 text-white text-xs font-semibold shadow-2xl flex items-center space-x-2 border border-white/10 animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Card */}
      <GlassCard variant="elevated" className="p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-200/50 dark:border-white/10">
          <div>
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-5 h-5 text-[#89190E] dark:text-[#EFC988]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Online Test & Question Paper Management
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Author timed mock examinations and upload question banks. The system automatically randomizes and assigns unique question sets to each student.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setTestTitle('');
                setTestInstructions('');
                setQuestionsBank([]);
                setFormError('');
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-linear-to-r from-[#89190E] to-[#B22222] hover:opacity-95 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-[#89190E]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create / Upload Test</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests by title or course..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#89190E]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="p-2 px-3 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none"
            >
              <option value="All">All Assigned Courses</option>
              {lmsCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Tests Roster */}
      <GlassCard variant="elevated" className="p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200/50 dark:border-white/10">
          <h3 className="font-serif text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            Available Online Examinations ({filteredTests.length})
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Real Database Records
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-gray-400 text-xs animate-pulse">
            Loading online tests from database...
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-[#89190E]/10 dark:bg-white/5 text-[#89190E] dark:text-[#EFC988] flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-8 h-8" />
            </div>
            <h4 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
              No Online Tests Configured Yet
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-5">
              You haven't created any question papers or examinations yet. Click below to create your first randomized online test.
            </p>
            <button
              onClick={() => {
                setTestTitle('');
                setTestInstructions('');
                setQuestionsBank([]);
                setFormError('');
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-linear-to-r from-[#89190E] to-[#B22222] text-white text-xs font-bold inline-flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Test</span>
            </button>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/60 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-b border-gray-200/50 dark:border-white/10">
                <tr>
                  <th className="p-3 font-serif font-bold">Test Title & Course</th>
                  <th className="p-3 font-serif font-bold">Question Bank</th>
                  <th className="p-3 font-serif font-bold">Per Student</th>
                  <th className="p-3 font-serif font-bold">Duration</th>
                  <th className="p-3 font-serif font-bold">Marks / Negative</th>
                  <th className="p-3 font-serif font-bold text-center">Status</th>
                  <th className="p-3 font-serif font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/40 dark:divide-white/10">
                {filteredTests.map((test) => (
                  <tr key={test.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3">
                      <div>
                        <h4 className="font-serif font-bold text-sm text-gray-900 dark:text-white">
                          {test.title}
                        </h4>
                        <span className="text-[11px] text-[#89190E] dark:text-[#EFC988] font-semibold block">
                          {test.courseName}
                        </span>
                      </div>
                    </td>

                    <td className="p-3 font-mono font-bold text-gray-800 dark:text-gray-200">
                      {test.questions ? test.questions.length : 0} Questions
                    </td>

                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      {test.questionsPerStudent} Random
                    </td>

                    <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      ⏱ {test.durationMinutes} mins
                    </td>

                    <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      +{test.marksPerQuestion} / -{test.negativeMarking}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleTogglePublish(test)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                          test.isPublished
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-white/10'
                        }`}
                        title="Click to toggle publication"
                      >
                        {test.isPublished ? (
                          <>
                            <Eye className="w-3 h-3 text-emerald-600" />
                            <span>Live (Active)</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => {
                            setActiveTestForDetail(test);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                          title="View Questions & Config"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setActiveTestForDelete(test);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                          title="Delete Test"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* ── 1. Create Test Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-white/10 relative my-8">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#89190E]/10 dark:bg-[#89190E]/20 text-[#89190E] dark:text-[#EFC988] flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Create Online Examination & Question Bank
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Configure test settings and add questions manually or import via Excel (.xlsx / .csv).
                </p>
              </div>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 dark:text-red-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTest} className="space-y-5 text-xs">
              {/* Row 1: Title & Course */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Test Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="e.g. PCS-J Landmark Judgments Speed Drill"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:border-[#89190E]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Target Course *
                  </label>
                  <select
                    required
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="">Select course...</option>
                    {lmsCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Exam Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Questions / Student
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(1, questionsBank.length)}
                    value={questionsPerStudent}
                    onChange={(e) => setQuestionsPerStudent(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-center font-mono font-bold text-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-center font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Marks / Question
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={marksPerQuestion}
                    onChange={(e) => setMarksPerQuestion(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-center font-mono font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Negative Marking
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={negativeMarking}
                    onChange={(e) => setNegativeMarking(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-center font-mono font-bold text-rose-600"
                  />
                </div>
              </div>

              {/* Question Bank Uploader / Builder Section */}
              <div className="border border-gray-200/80 dark:border-white/10 rounded-2xl p-4 sm:p-5 bg-white dark:bg-white/5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/10">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-[#89190E] dark:text-[#EFC988]" />
                    <span className="font-serif font-bold text-sm text-gray-900 dark:text-white">
                      Question Bank ({questionsBank.length} Questions Loaded)
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".xlsx, .xls, .csv"
                      onChange={handleExcelImport}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Import Excel (.xlsx)</span>
                    </button>
                  </div>
                </div>

                {/* Manual Question Form */}
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      Add Question Manually:
                    </label>
                    <input
                      type="text"
                      value={manualQuestionText}
                      onChange={(e) => setManualQuestionText(e.target.value)}
                      placeholder="e.g. Which Constitutional Amendment introduced Article 21A?"
                      className="w-full p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-gray-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={manualOptionA}
                      onChange={(e) => setManualOptionA(e.target.value)}
                      placeholder="Option A"
                      className="p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={manualOptionB}
                      onChange={(e) => setManualOptionB(e.target.value)}
                      placeholder="Option B"
                      className="p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={manualOptionC}
                      onChange={(e) => setManualOptionC(e.target.value)}
                      placeholder="Option C"
                      className="p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={manualOptionD}
                      onChange={(e) => setManualOptionD(e.target.value)}
                      placeholder="Option D"
                      className="p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400">Correct Answer:</span>
                      <select
                        value={manualCorrectAnswer}
                        onChange={(e) => setManualCorrectAnswer(Number(e.target.value))}
                        className="p-1 px-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-bold text-emerald-600"
                      >
                        <option value={0}>Option A</option>
                        <option value={1}>Option B</option>
                        <option value={2}>Option C</option>
                        <option value={3}>Option D</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddManualQuestion}
                      className="px-3.5 py-1.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-950 font-bold text-xs hover:opacity-90 cursor-pointer"
                    >
                      + Add to Bank
                    </button>
                  </div>
                </div>

                {/* Questions Preview List */}
                {questionsBank.length > 0 && (
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5 space-y-1">
                    {questionsBank.map((q, idx) => (
                      <div key={q.id} className="py-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-bold text-gray-900 dark:text-white block truncate">
                            {idx + 1}. {q.text}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            Correct: Option {['A', 'B', 'C', 'D'][q.correctAnswer]} ({q.options[q.correctAnswer]})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuestionsBank((prev) => prev.filter((item) => item.id !== q.id))}
                          className="text-red-500 hover:text-red-700 p-1 shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-[#89190E] to-[#B22222] text-white font-bold flex items-center justify-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <span>Saving Test...</span> : <span>Save & Publish Examination</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2. Test Details Modal ── */}
      {showDetailModal && activeTestForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-200 dark:border-white/10 relative">
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white mb-1">
              {activeTestForDetail.title}
            </h3>
            <span className="text-xs text-[#89190E] dark:text-[#EFC988] font-bold block mb-4">
              {activeTestForDetail.courseName}
            </span>

            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-white/5 text-xs mb-5 font-mono">
              <div>
                <span className="text-gray-400 block text-[10px]">TOTAL QUESTIONS</span>
                <strong>{activeTestForDetail.questions?.length || 0} Bank</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">PER STUDENT</span>
                <strong>{activeTestForDetail.questionsPerStudent} Selected</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">DURATION</span>
                <strong>{activeTestForDetail.durationMinutes} Minutes</strong>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Question Bank Preview:
              </h4>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                {activeTestForDetail.questions?.map((q, idx) => (
                  <div key={q.id} className="p-3 rounded-xl border border-gray-100 dark:border-white/10 bg-white/40 dark:bg-white/5 text-xs">
                    <p className="font-bold text-gray-900 dark:text-white mb-2">
                      {idx + 1}. {q.text}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {q.options?.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-1.5 rounded-lg border ${
                            oIdx === q.correctAnswer
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                              : 'border-gray-200/50 dark:border-white/5 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {['A', 'B', 'C', 'D'][oIdx]}. {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Delete Confirmation Modal ── */}
      {showDeleteModal && activeTestForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-red-200 dark:border-red-900/40 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-4">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white mb-2">
              Delete Examination?
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-gray-800 dark:text-gray-200">"{activeTestForDelete.title}"</strong> and all its stored questions? This action cannot be reversed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTest}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Yes, Delete Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
