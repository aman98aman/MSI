import Link from 'next/link';
import { CalendarCheck2, LogIn, ArrowRight, ShieldCheck, Sparkles, BookOpen, Clock, Award } from 'lucide-react';
import { listExamCollection } from '@/lib/examDb';
import { ExamEvent } from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

export default async function ExamIndexPage() {
  let exams: ExamEvent[] = [];
  try {
    exams = await listExamCollection<ExamEvent>('exam_events', { status: 'published' }, { createdAt: -1 });
  } catch (_) {
    exams = [];
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-200 text-xs font-bold text-[#89190E] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Official Examination Portal 2027</span>
          </div>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#071B37]">
            MSI Online Examinations & Mock Tests
          </h1>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Register for verified Computer-Based Tests (CBT), All-India Mock Series, and practice papers accredited by MSI Group of Institutes.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/exam/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#071B37] hover:bg-[#0c2b54] text-white text-xs font-bold transition-all shadow-sm"
            >
              <LogIn className="w-4 h-4 text-[#EFC988]" />
              <span>Candidate Login with UID</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-xs font-bold text-[#071B37] transition-all"
            >
              <span>Back to MSI Home</span>
            </Link>
          </div>
        </div>

        {/* Exams List Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.length > 0 ? (
            exams.map((exam) => {
              const isFree = exam.registrationConfig?.isFree || exam.registrationConfig?.feeAmount === 0;
              const fee = exam.registrationConfig?.feeAmount || 0;
              const slug = exam.publicSlug || exam.code.toLowerCase();

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-3xl p-6 shadow-md border border-[#E8EEFF] hover:border-[#89190E]/40 hover:shadow-xl transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        {exam.code}
                      </span>
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                          isFree
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {isFree ? '100% FREE' : `₹${fee} INR`}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-lg text-[#071B37] leading-snug">
                      {exam.title}
                    </h3>

                    <p className="text-xs text-gray-500 line-clamp-2">
                      {exam.description || 'Official MSI entrance mock test series with simulated CBT questions.'}
                    </p>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {exam.scheduleConfig?.durationMinutes || 120} Mins
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Instant UID
                      </span>
                    </div>
                  </div>

                  <div className="pt-5">
                    <Link
                      href={`/exam/${slug}`}
                      className="w-full py-2.5 rounded-xl bg-[#89190E] hover:bg-[#6e130b] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <span>{isFree ? 'Register for Free Mock' : `Enroll & Pay ₹${fee}`}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-white rounded-3xl p-8 text-center space-y-4 shadow-sm border border-gray-200">
              <CalendarCheck2 className="w-10 h-10 text-[#89190E] mx-auto" />
              <h3 className="font-serif font-bold text-lg text-[#071B37]">
                Examinations are being scheduled.
              </h3>
              <p className="text-xs text-gray-500">
                Please check back shortly or connect with the MSI admissions desk.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
