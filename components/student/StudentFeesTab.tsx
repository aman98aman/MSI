'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  AlertCircle,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
  QrCode,
  Lock,
  Building2,
  Wallet,
} from 'lucide-react';
import {
  FeeBreakdownItem,
  FeeTransaction,
  StudentProfile,
  FEE_SUMMARY,
} from './data/studentMockData';
import GlassCard from '../glass/GlassCard';

export interface FeePaymentRequest {
  id: string;
  title: string;
  amount: number;
  originalPrice?: number;
}

interface StudentFeesTabProps {
  student: StudentProfile & { totalFee?: number; paidFee?: number; dueFee?: number; nextDueDate?: string };
  breakdown: FeeBreakdownItem[];
  transactions: FeeTransaction[];
  onViewReceipt: (tx: FeeTransaction) => void;
  onPayFee?: (item: FeePaymentRequest) => void;
}

export default function StudentFeesTab({
  student,
  breakdown,
  transactions,
  onViewReceipt,
  onPayFee,
}: StudentFeesTabProps) {
  // Dynamic summary computation based on breakdown and transactions
  const totalFee =
    typeof student?.totalFee === 'number'
      ? student.totalFee
      : breakdown.length > 0
      ? breakdown.reduce((sum, item) => sum + item.amount, 0)
      : 0;

  const paidFee =
    typeof student?.paidFee === 'number'
      ? student.paidFee
      : transactions.length > 0
      ? transactions.reduce((sum, tx) => (tx.status === 'Successful' || (tx.status as string) === 'captured' ? sum + tx.amount : sum), 0)
      : breakdown.filter((b) => b.status === 'Paid').reduce((sum, b) => sum + b.amount, 0) || 0;

  const pendingFee =
    typeof student?.dueFee === 'number'
      ? student.dueFee
      : Math.max(0, totalFee - paidFee);
  const paidRatio = totalFee > 0 ? Math.min(100, Math.round((paidFee / totalFee) * 100)) : 100;
  const hasFee = totalFee > 0;

  // Quick Pay State
  const [selectedPreset, setSelectedPreset] = useState<number>(
    pendingFee > 0 ? Math.min(pendingFee, 25000) : 5000
  );
  const [customAmountInput, setCustomAmountInput] = useState<string>('');
  const [selectedPurpose, setSelectedPurpose] = useState<string>(
    'Academic Tuition & Mentorship Installment'
  );

  const activeAmount =
    customAmountInput && Number(customAmountInput) > 0
      ? Number(customAmountInput)
      : selectedPreset;

  const handleTriggerQuickPayment = () => {
    if (!onPayFee) return;
    if (activeAmount <= 0) return;

    onPayFee({
      id: `fee-installment-${Date.now().toString().slice(-4)}`,
      title: `${selectedPurpose} (Academic Session 2026-27)`,
      amount: activeAmount,
      originalPrice: activeAmount,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Fee Summary */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-[#0E1A2E] via-[#162D50] to-[#6A1610] text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(239,201,136,0.15),transparent_50%)] pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
          <div className="max-w-xl">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#EFC988]" />
              <span className="text-[10px] sm:text-xs font-mono tracking-widest text-[#EFC988] uppercase font-bold">
                Official Bursar & Accounts Ledger • MSI Academic Session 2026-27
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1.5">
              Fee Ledger, Institutional Receipts & Validity
            </h2>
            <p className="text-white/80 text-xs sm:text-sm mt-2 leading-relaxed">
              {hasFee
                ? `Your active enrollment is in good financial standing. You have cleared ${paidRatio}% of your academic dues via authenticated Razorpay gateways.`
                : 'Your student account is in good standing with zero outstanding institutional dues.'}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                Course Validity: {student.validUntil || 'Active'}
              </span>
              <span className="px-3 py-1 rounded-lg bg-white/10 text-white/90">
                Candidate: {student.name}
              </span>
              <span className="px-3 py-1 rounded-lg bg-white/10 text-white/90">
                Roll No: {student.rollNo}
              </span>
            </div>
          </div>

          {/* Fee Balance Metric */}
          <div className="p-5 rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 text-center min-w-[220px] flex-shrink-0">
            <span className="text-[10px] font-mono tracking-wider uppercase text-white/70 block">
              Pending Dues
            </span>
            <span className="font-serif text-3xl font-bold text-[#EFC988] mt-1 block">
              ₹{pendingFee.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-emerald-300 block mt-1 font-semibold">
              {pendingFee === 0 ? '✓ All Dues Cleared' : `Next Due: ${FEE_SUMMARY.nextDueDate}`}
            </span>

            {pendingFee > 0 && onPayFee && (
              <button
                type="button"
                onClick={() =>
                  onPayFee({
                    id: 'fee-pending-total',
                    title: 'Full Outstanding Academic Dues Settlement',
                    amount: pendingFee,
                    originalPrice: pendingFee,
                  })
                }
                className="mt-3 w-full py-2 px-3 rounded-xl bg-linear-to-r from-[#EFC988] to-[#deb367] text-[#10233F] font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:brightness-105 transition-all cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 text-[#10233F]" />
                <span>Pay Dues Online</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Paid vs Pending Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <GlassCard variant="default" className="p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
            Total Program Fee
          </span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
            ₹{totalFee.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Official enrolled curriculum ledger</p>
        </GlassCard>

        <GlassCard variant="default" className="p-6 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              Total Fee Cleared
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              {paidRatio}% Cleared
            </span>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            ₹{paidFee.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400/80 mt-1">
            {transactions.length > 0
              ? `${transactions.length} Verified E-Receipt(s)`
              : 'Cleared via Online Transfer'}
          </p>
        </GlassCard>

        <GlassCard variant="default" className="p-6 border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
              Outstanding Balance
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              {pendingFee === 0 ? 'Nil' : 'Active Balance'}
            </span>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#89190E] dark:text-[#EFC988] mt-2">
            ₹{pendingFee.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {pendingFee === 0 ? 'Zero outstanding balance' : 'Gateway checkout active'}
          </p>
        </GlassCard>
      </div>

      {/* 3. Official Razorpay Institutional Fee Payment Console (Same as Course Order Time) */}
      {onPayFee && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white border-2 border-[#0C66E4]/25 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#0C66E4]/5 rounded-bl-full pointer-events-none" />

          {/* Header Strip with Razorpay Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-gray-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#0C66E4]/10 text-[#0C66E4] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#0C66E4]" />
                  Razorpay Verified Gateway
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  • Real-Time HMAC-SHA256 Handshake
                </span>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#10233F] mt-1">
                Online Academic Fee Settlement Desk
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Pay semester tuition, mock test kits, or custom installments using the same unified gateway options (UPI, Cards, Netbanking, EMI & Pay Later) as course purchase time.
              </p>
            </div>

            {/* Gateway Rails Micro-Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-1 rounded-md bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                <QrCode className="w-3 h-3 text-blue-600" />
                UPI / QR
              </span>
              <span className="px-2 py-1 rounded-md bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-emerald-600" />
                Cards
              </span>
              <span className="px-2 py-1 rounded-md bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-600" />
                Netbanking
              </span>
              <span className="px-2 py-1 rounded-md bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                Pay Later
              </span>
            </div>
          </div>

          {/* Payment Amount & Preset Selector */}
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Select Installment Amount or Enter Custom Value
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[2500, 5000, 10000, 25000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(amt);
                      setCustomAmountInput('');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeAmount === amt && !customAmountInput
                        ? 'bg-[#0C66E4] text-white shadow-xs scale-102'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}

                {pendingFee > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset(pendingFee);
                      setCustomAmountInput('');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeAmount === pendingFee && !customAmountInput
                        ? 'bg-[#89190E] text-white shadow-xs scale-102'
                        : 'bg-rose-50 text-[#89190E] border border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    Full Balance: ₹{pendingFee.toLocaleString('en-IN')}
                  </button>
                )}

                {/* Custom Amount Input */}
                <div className="relative min-w-[140px] flex-1 sm:flex-initial">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="100"
                    step="500"
                    placeholder="Custom amount"
                    value={customAmountInput}
                    onChange={(e) => setCustomAmountInput(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-800 focus:outline-hidden focus:border-[#0C66E4] focus:ring-1 focus:ring-[#0C66E4]"
                  />
                </div>
              </div>
            </div>

            {/* Purpose Selector & Payment Trigger */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Fee Allocation Category
                </label>
                <select
                  value={selectedPurpose}
                  onChange={(e) => setSelectedPurpose(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-hidden focus:border-[#0C66E4]"
                >
                  <option value="Academic Tuition & Mentorship (Semester 2)">
                    Academic Tuition & Mentorship (Semester 2)
                  </option>
                  <option value="All-India Grand Mock Test Series & Ranking Audit">
                    All-India Grand Mock Test Series & Ranking Audit
                  </option>
                  <option value="Digital LMS, Library & Bare Acts Kit Installment">
                    Digital LMS, Library & Bare Acts Kit Installment
                  </option>
                  <option value="General Institutional Fee Settlement">
                    General Institutional Fee Settlement
                  </option>
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleTriggerQuickPayment}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0C66E4] hover:bg-[#0852B8] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Pay ₹{activeAmount.toLocaleString('en-IN')} with Razorpay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Fee Component Breakdown Table */}
      <GlassCard variant="elevated" className="p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200/50 dark:border-white/10">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-[#89190E] dark:text-[#EFC988]" />
            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
              Fee Component Breakdown & Online Settlement
            </h3>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Annual Syllabus Structure</span>
        </div>

        {breakdown.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">
            No fee components currently billed. Your financial account is in good standing.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/60 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-b border-gray-200/50 dark:border-white/10">
                <tr>
                  <th className="p-3 font-serif font-bold">Category</th>
                  <th className="p-3 font-serif font-bold">Amount (INR)</th>
                  <th className="p-3 font-serif font-bold">Status</th>
                  <th className="p-3 font-serif font-bold">Due / Clearance</th>
                  <th className="p-3 font-serif font-bold text-right">Gateway Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/40 dark:divide-white/10">
                {breakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">{item.category}</td>
                    <td className="p-3 font-mono font-bold text-gray-800 dark:text-gray-200">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.status === 'Paid' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{item.status}</span>
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 dark:text-gray-400">
                      {item.dueDate ? item.dueDate : 'Receipt Generated'}
                    </td>
                    <td className="p-3 text-right">
                      {item.status === 'Pending' && onPayFee ? (
                        <button
                          type="button"
                          onClick={() =>
                            onPayFee({
                              id: `fee-comp-${idx}`,
                              title: item.category,
                              amount: item.amount,
                              originalPrice: item.amount,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#0C66E4] hover:bg-[#0852B8] text-white text-[11px] font-bold inline-flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3 h-3 text-[#EFC988]" />
                          <span>Pay with Gateway</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Cleared ✓</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* 5. Payment History Ledger & Verified Official Receipts */}
      <GlassCard variant="elevated" className="p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200/50 dark:border-white/10">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#89190E] dark:text-[#EFC988]" />
            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
              Payment History Ledger & Verified Official Receipts
            </h3>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Instant PDF Download</span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">
            No payment transactions on record yet. Any payments made online via Razorpay will generate verifiable e-receipts here.
          </div>
        ) : (
          <div className="space-y-3.5 mt-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-5 rounded-2xl border border-gray-200/60 dark:border-white/10 hover:border-[#89190E] dark:hover:border-[#EFC988] transition-all bg-white/60 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-[#89190E] dark:text-[#EFC988] bg-[#89190E]/10 dark:bg-[#89190E]/20 px-2.5 py-0.5 rounded-md border border-[#89190E]/20 dark:border-[#EFC988]/30">
                      {tx.receiptNo}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">Paid on {tx.date}</span>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      ● {tx.status}
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                    {tx.remarks}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Mode: <strong className="text-gray-700 dark:text-gray-200">{tx.mode}</strong> • System Ref: {tx.id}
                  </p>
                </div>

                <div className="flex items-center space-x-4 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase block">Amount Paid</span>
                    <span className="font-serif text-lg font-bold text-gray-900 dark:text-white">
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    onClick={() => onViewReceipt(tx)}
                    className="px-4 py-2.5 rounded-xl bg-linear-to-r from-[#89190E] to-[#B22222] hover:opacity-95 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-[#89190E]/20 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#EFC988]" />
                    <span>View Official Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
