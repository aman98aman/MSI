'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, CheckCircle2, ShieldCheck, RefreshCw, X, AlertCircle } from 'lucide-react';

interface MobileVerifyModalProps {
  mobile: string;
  visitorName: string;
  onVerified: () => void;
  onClose: () => void;
}

export default function MobileVerifyModal({
  mobile,
  visitorName,
  onVerified,
  onClose,
}: MobileVerifyModalProps) {
  // Generate random 4-digit code
  const [generatedOtp, setGeneratedOtp] = useState('4829');
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Refresh OTP code on mount
  useEffect(() => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleChangeDigit = (index: number, val: string) => {
    setError('');
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    if (cleanVal && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted) {
      const newDigits = ['', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setDigits(newDigits);
      if (pasted.length === 4) {
        inputRefs[3].current?.focus();
      }
    }
  };

  const handleVerify = () => {
    const entered = digits.join('');
    if (entered.length < 4) {
      setError('Please enter the complete 4-digit verification code.');
      return;
    }

    if (entered !== generatedOtp) {
      setError(`Invalid OTP code entered. (Demo code is: ${generatedOtp})`);
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccess(true);
      setTimeout(() => {
        onVerified();
      }, 700);
    }, 600);
  };

  const handleQuickFill = () => {
    setDigits(generatedOtp.split(''));
    setError('');
    setTimeout(() => {
      inputRefs[3].current?.focus();
    }, 50);
  };

  const handleResend = () => {
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(newCode);
    setCountdown(30);
    setDigits(['', '', '', '']);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8DCCB] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFF9EF] border-b border-[#E8DCCB] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#10233F]">
                Mobile Verification (OTP)
              </h3>
              <p className="text-[11px] text-[#526174]">
                Statutory security identity validation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#526174] hover:text-[#10233F] hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF3DD] border border-[#EFC988] text-[#89190E] flex items-center justify-center mx-auto mb-3">
            <Smartphone className="w-6 h-6" />
          </div>

          <h4 className="font-bold text-sm text-[#10233F]">
            Enter 4-Digit Code sent to +91 {mobile}
          </h4>
          <p className="text-xs text-[#526174] mt-1">
            Verification required for visitor entry pass issuance for{' '}
            <span className="font-semibold text-[#10233F]">{visitorName || 'Visitor'}</span>.
          </p>

          {/* Simulated SMS Alert Banner */}
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-left flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Simulated SMS Gateway Received
              </span>
              <p className="text-xs font-mono font-bold text-emerald-950 mt-0.5">
                OTP Code: <span className="text-base tracking-widest text-[#89190E] bg-white px-2 py-0.5 rounded border border-emerald-300">{generatedOtp}</span>
              </p>
              <p className="text-[10px] text-emerald-700 mt-1">
                Valid for 10 minutes. Do not share with unauthorized persons.
              </p>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[11px] font-bold text-[#89190E] hover:underline bg-white px-2.5 py-1.5 rounded-lg border border-emerald-300 shadow-xs flex-shrink-0"
            >
              Auto-Fill
            </button>
          </div>

          {/* 4-digit input */}
          <div className="mt-6 flex justify-center space-x-3" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChangeDigit(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={isVerifying || isSuccess}
                className={`w-13 h-14 text-center font-mono text-2xl font-bold rounded-2xl border-2 transition-all outline-none ${
                  isSuccess
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : digit
                    ? 'border-[#89190E] bg-[#FFF9EF] text-[#10233F] ring-2 ring-[#89190E]/20'
                    : 'border-[#E8DCCB] bg-white text-[#10233F] focus:border-[#89190E]'
                }`}
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-3.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Resend Link */}
          <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-[#526174]">
            <span>Didn&apos;t receive SMS?</span>
            {countdown > 0 ? (
              <span className="font-mono text-[#89190E] font-semibold">
                Resend in {countdown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="font-semibold text-[#89190E] hover:underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Resend Code</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-[#FFF9EF]/60 border-t border-[#E8DCCB] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#526174] hover:bg-black/5 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isVerifying || isSuccess}
            onClick={handleVerify}
            className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all shadow-md ${
              isSuccess
                ? 'bg-emerald-600'
                : 'bg-[#89190E] hover:bg-[#65130D] shadow-[#89190E]/20'
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Mobile Verified!</span>
              </>
            ) : isVerifying ? (
              <span>Validating...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Mobile</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
