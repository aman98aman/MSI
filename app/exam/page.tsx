import Link from 'next/link';
import { CalendarX2, LogIn } from 'lucide-react';

export default function ExamIndexPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-[#E8EEFF] text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#071B37] text-[#EFC988] flex items-center justify-center mx-auto">
          <CalendarX2 className="w-7 h-7" />
        </div>
        <h1 className="font-serif font-bold text-2xl text-[#071B37]">
          No examination is currently available.
        </h1>
        <p className="text-xs text-gray-500 leading-relaxed">
          Please use the official registration link or QR code provided by MSI Group of Institutes, or log in if you already have your Candidate UID.
        </p>
        <div className="pt-2 flex flex-col gap-2.5">
          <Link
            href="/exam/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#89190E] hover:bg-[#6e130b] text-white text-xs font-bold"
          >
            <LogIn className="w-4 h-4" />
            Candidate Exam Login (UID)
          </Link>
          <Link href="/" className="text-xs font-bold text-[#071B37] hover:underline">
            Return to MSI Home
          </Link>
        </div>
      </div>
    </div>
  );
}
