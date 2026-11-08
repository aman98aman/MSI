'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle2, AlertCircle, Award, ChevronLeft, ChevronRight, RotateCcw, ShieldCheck } from 'lucide-react';
import { TestItem, TIMED_MOCK_QUESTIONS } from './data/studentMockData';

interface TimedTestModalProps {
  test: TestItem | null;
  onClose: () => void;
  onComplete?: (score: number, total: number) => void;
}

export default function TimedTestModal({ test, onClose, onComplete }: TimedTestModalProps) {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState((test?.durationMinutes || 5) * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (isSubmitted || !test) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, test]);

  if (!test) return null;

  const questions = TIMED_MOCK_QUESTIONS;
  const currentQ = questions[currentQIndex];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optIndex,
    }));
  };

  const toggleFlagQuestion = (qId: number) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleSubmitTest = () => {
    setIsSubmitted(true);
    let correctCount = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });
    if (onComplete) {
      onComplete(correctCount * 4, questions.length * 4);
    }
  };

  // Calculate score & stats
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;

  questions.forEach((q) => {
    if (selectedAnswers[q.id] === undefined) {
      unattemptedCount += 1;
    } else if (selectedAnswers[q.id] === q.correctIndex) {
      correctCount += 1;
    } else {
      wrongCount += 1;
    }
  });

  const totalScore = correctCount * 4 - wrongCount * 1; // Standard PCS-J marking scheme: +4 / -1
  const maxScore = questions.length * 4;
  const percentage = Math.max(0, Math.round((totalScore / maxScore) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#10233F]/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white border border-[#E8DCCB] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Test Header */}
        <div className="bg-[#10233F] text-white px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between border-b border-[#EFC988]/30 gap-2">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EFC988] animate-pulse-beacon flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-[10px] sm:text-xs font-mono tracking-wider text-[#EFC988] uppercase font-bold truncate">
                  {test.type} Exam Sim
                </span>
                <span className="text-white/40 hidden xs:inline">•</span>
                <span className="text-[10px] sm:text-xs text-white/70 hidden xs:inline">Marking: +4 / -1</span>
              </div>
              <h3 className="font-serif text-sm sm:text-lg font-bold text-white tracking-wide truncate max-w-md">
                {test.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {!isSubmitted && (
              <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-white/10 border border-white/20 font-mono text-xs sm:text-base font-bold text-[#EFC988]">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#EFC988]" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close Test"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isSubmitted ? (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-4 p-5 sm:p-7 gap-6 bg-[#FFF9EF]/40">
            {/* Main Question Display */}
            <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
              <div>
                {/* Question Info Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E8DCCB]">
                  <span className="text-xs font-bold text-[#89190E] tracking-wider uppercase bg-[#89190E]/10 px-2.5 py-1 rounded-lg">
                    Question {currentQIndex + 1} of {questions.length} • {currentQ.subject}
                  </span>
                  <button
                    onClick={() => toggleFlagQuestion(currentQ.id)}
                    className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${
                      flaggedQuestions[currentQ.id]
                        ? 'bg-[#EFC988] text-[#10233F] border-[#EFC988]'
                        : 'bg-white text-[#526174] border-[#E8DCCB] hover:border-[#89190E]'
                    }`}
                  >
                    {flaggedQuestions[currentQ.id] ? '★ Flagged for Review' : '☆ Flag for Review'}
                  </button>
                </div>

                {/* Question Stem */}
                <p className="mt-4 font-sans font-semibold text-base sm:text-lg text-[#10233F] leading-relaxed">
                  {currentQ.question}
                </p>

                {/* Options */}
                <div className="mt-5 space-y-3">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = selectedAnswers[currentQ.id] === idx;
                    const optionLabels = ['A', 'B', 'C', 'D'];
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start space-x-3.5 group ${
                          isSelected
                            ? 'bg-[#89190E]/10 border-[#89190E] shadow-sm'
                            : 'bg-white border-[#E8DCCB] hover:border-[#EFC988] hover:bg-[#FFF9EF]/60'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#89190E] text-white'
                              : 'bg-[#FFF3DD] text-[#89190E] group-hover:bg-[#EFC988]'
                          }`}
                        >
                          {optionLabels[idx]}
                        </span>
                        <span className={`text-sm sm:text-base ${isSelected ? 'font-semibold text-[#10233F]' : 'text-[#526174]'}`}>
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Nav Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E8DCCB]">
                <button
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                  className="flex items-center space-x-1 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-[#E8DCCB] text-[#526174] hover:text-[#10233F] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-2">
                  {currentQIndex < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQIndex((prev) => prev + 1)}
                      className="flex items-center space-x-1.5 px-5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-[#10233F] hover:bg-[#1c355e] text-white shadow-sm"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitTest}
                      className="px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-[#89190E] hover:bg-[#65130D] text-white shadow-md shadow-[#89190E]/30 animate-pulse-gold"
                    >
                      Submit Test
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Question Palette Sidebar */}
            <div className="lg:col-span-1 bg-white p-4 rounded-2xl border border-[#E8DCCB] flex flex-col justify-between">
              <div>
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#10233F] pb-2 border-b border-[#E8DCCB]">
                  Question Palette
                </h4>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {questions.map((q, idx) => {
                    const isAnswered = selectedAnswers[q.id] !== undefined;
                    const isFlagged = flaggedQuestions[q.id];
                    const isCurrent = currentQIndex === idx;

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQIndex(idx)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all relative ${
                          isCurrent
                            ? 'ring-2 ring-[#89190E] ring-offset-2'
                            : ''
                        } ${
                          isAnswered
                            ? 'bg-[#10233F] text-white'
                            : isFlagged
                            ? 'bg-[#EFC988] text-[#10233F]'
                            : 'bg-[#FFF3DD] text-[#526174] hover:bg-[#E8DCCB]'
                        }`}
                      >
                        {idx + 1}
                        {isFlagged && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#89190E]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-2 text-[11px] text-[#526174]">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-md bg-[#10233F]" />
                    <span>Answered ({Object.keys(selectedAnswers).length})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-md bg-[#EFC988]" />
                    <span>Flagged for Review ({Object.values(flaggedQuestions).filter(Boolean).length})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-md bg-[#FFF3DD]" />
                    <span>Unvisited ({questions.length - Object.keys(selectedAnswers).length})</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8DCCB]">
                <button
                  onClick={handleSubmitTest}
                  className="w-full py-2.5 rounded-xl bg-[#89190E] text-white font-bold text-xs tracking-wide uppercase hover:bg-[#65130D] transition-colors"
                >
                  Final Submit
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Scorecard & Result Breakdown */
          <div className="p-6 sm:p-8 overflow-y-auto max-h-[80vh] bg-[#FFF9EF]/60">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-[#89190E]/10 border border-[#89190E]/30 flex items-center justify-center mx-auto mb-3">
                <Award className="w-8 h-8 text-[#89190E]" />
              </div>
              <span className="text-xs uppercase tracking-widest text-[#89190E] font-bold">
                Examination Assessment Completed
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#10233F] mt-1">
                Diagnostic Performance Scorecard
              </h2>
              <p className="text-xs sm:text-sm text-[#526174] mt-1">
                {test.title} • Automated Evaluation & Negative Marking Computed
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
                <div className="p-4 rounded-2xl bg-white border border-[#E8DCCB] shadow-sm">
                  <span className="text-[11px] text-[#526174] uppercase font-bold block">Score</span>
                  <span className="text-2xl font-serif font-bold text-[#89190E]">
                    {totalScore} <span className="text-xs text-[#526174]">/ {maxScore}</span>
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#E8DCCB] shadow-sm">
                  <span className="text-[11px] text-[#526174] uppercase font-bold block">Accuracy</span>
                  <span className="text-2xl font-serif font-bold text-[#10233F]">
                    {percentage}%
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#E8DCCB] shadow-sm">
                  <span className="text-[11px] text-[#526174] uppercase font-bold block">Correct</span>
                  <span className="text-2xl font-serif font-bold text-emerald-700">
                    {correctCount}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#E8DCCB] shadow-sm">
                  <span className="text-[11px] text-[#526174] uppercase font-bold block">Wrong / Left</span>
                  <span className="text-2xl font-serif font-bold text-amber-700">
                    {wrongCount} / {unattemptedCount}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                <button
                  onClick={() => setReviewMode(!reviewMode)}
                  className="px-5 py-2.5 rounded-xl bg-[#10233F] text-white font-semibold text-xs sm:text-sm hover:bg-[#1c355e] transition-all flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#EFC988]" />
                  <span>{reviewMode ? 'Hide Answer Review' : 'Detailed Question Analysis'}</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedAnswers({});
                    setFlaggedQuestions({});
                    setTimeLeft((test?.durationMinutes || 5) * 60);
                    setIsSubmitted(false);
                    setReviewMode(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white border border-[#89190E] text-[#89190E] font-semibold text-xs sm:text-sm hover:bg-[#FFF9EF] transition-all flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake Test</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#89190E] text-white font-semibold text-xs sm:text-sm hover:bg-[#65130D] transition-all"
                >
                  Done & Back to Portal
                </button>
              </div>

              {/* Detailed Review Section */}
              {reviewMode && (
                <div className="text-left space-y-4 pt-4 border-t border-[#E8DCCB]">
                  <h4 className="font-serif font-bold text-base text-[#10233F]">
                    Answer Explanations & Bare Act References
                  </h4>
                  {questions.map((q, idx) => {
                    const studentChoice = selectedAnswers[q.id];
                    const isCorrect = studentChoice === q.correctIndex;
                    const isUnattempted = studentChoice === undefined;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-2xl border ${
                          isCorrect
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : isUnattempted
                            ? 'bg-amber-50/70 border-amber-300'
                            : 'bg-rose-50/70 border-rose-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-xs uppercase tracking-wider text-[#10233F]">
                            Q{idx + 1}. {q.subject}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              isCorrect
                                ? 'bg-emerald-200 text-emerald-900'
                                : isUnattempted
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-rose-200 text-rose-900'
                            }`}
                          >
                            {isCorrect ? '+4 Marks (Correct)' : isUnattempted ? '0 (Unattempted)' : '-1 Mark (Wrong)'}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-[#10233F]">{q.question}</p>

                        <div className="mt-3 space-y-1 text-xs">
                          <p>
                            <span className="font-bold">Correct Answer:</span> Option {['A', 'B', 'C', 'D'][q.correctIndex]} — {q.options[q.correctIndex]}
                          </p>
                          {!isUnattempted && (
                            <p>
                              <span className="font-bold">Your Response:</span> Option {['A', 'B', 'C', 'D'][studentChoice]} — {q.options[studentChoice]}
                            </p>
                          )}
                        </div>

                        <div className="mt-3 p-3 bg-white/90 rounded-xl text-xs text-[#526174] border border-[#E8DCCB]">
                          <span className="font-bold text-[#89190E] block mb-1">Faculty Explanation:</span>
                          {q.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
