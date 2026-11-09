'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Eye, EyeOff, Lock, Phone, ArrowRight, Sparkles, Building2, CheckCircle2 } from 'lucide-react';

export default function MarketingLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter both your mobile/email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/marketing/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: identifier, password }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        localStorage.setItem('msi_marketing_user', JSON.stringify(data.user));
        router.push('/marketing/dashboard');
      } else {
        setErrorMessage(data.message || 'Invalid marketing credentials. Please check with Super Admin.');
      }
    } catch (err) {
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    setIdentifier('9888877771');
    setPassword('Marketing@MSI2026');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#FFF9EF] flex flex-col justify-between relative overflow-hidden selection:bg-[#EFC988] selection:text-[#89190E]">
      {/* Decorative Blueprint & Ambient Glows */}
      <div className="absolute inset-0 blueprint-grid opacity-20 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#89190E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#EFC988]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="p-6 relative z-10 flex items-center justify-between max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#89190E] flex items-center justify-center text-white font-serif font-black shadow-md border border-[#EFC988]/40">
            M
          </div>
          <div>
            <div className="text-base font-serif font-bold text-[#10233F] tracking-wide">
              MSI GROUP OF INSTITUTES
            </div>
            <div className="text-[10px] uppercase tracking-widest text-[#89190E] font-semibold">
              Marketing & Outreach Portal
            </div>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs font-semibold text-slate-600 hover:text-[#89190E] transition-colors flex items-center space-x-1"
        >
          <span>Return to Website</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Login Container */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl border border-[#EFC988]/40 shadow-2xl p-8 relative">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#89190E]/10 text-[#89190E] mb-3 border border-[#89190E]/20">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-serif font-black text-[#10233F] tracking-tight">
              Marketing Executive Desk
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage public blogs, distribute inbound leads & track receptionist call metrics.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Registered Mobile or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9888877771"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#89190E]/30 focus:border-[#89190E] text-sm text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your assigned password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#89190E]/30 focus:border-[#89190E] text-sm text-slate-900 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#89190E] hover:bg-[#70140B] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#89190E]/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In to Marketing Desk</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Demo Marketing Staff:</span>
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-[#89190E] font-bold hover:underline cursor-pointer flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Fill 9888877771</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-400 relative z-10">
        MSI Group of Institutes &bull; Authorized Staff Portal &bull; SCO 2461, Sector 22-C, Chandigarh
      </footer>
    </div>
  );
}

