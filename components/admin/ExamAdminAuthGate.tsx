'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';

interface ExamAdminAuthGateProps {
  children: React.ReactNode;
}

export default function ExamAdminAuthGate({ children }: ExamAdminAuthGateProps) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/examinations/session')
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setAuthenticated(Boolean(data?.authenticated));
        setChecking(false);
      })
      .catch(() => {
        if (!active) return;
        setAuthenticated(false);
        setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/examinations/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthenticated(true);
      } else {
        setError(data.message || 'Invalid Super Admin credentials.');
      }
    } catch {
      setError('Network error verifying credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center">
        <div className="text-sm font-semibold text-[#071B37] animate-pulse">
          Verifying Super Admin Examination Session...
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#071B37] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-[#E8EEFF]">
          <div className="w-12 h-12 rounded-2xl bg-[#071B37] text-[#EFC988] flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-[#071B37]">
            MSI Examinations Console
          </h1>
          <p className="text-xs text-gray-500 mt-1 mb-6">
            Server-verified Super Admin session required to manage examinations, answer keys, and candidate records.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#071B37] mb-1">
                Admin Mobile or Official Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="9792303434 or admin@msi-institutes.edu.in"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-[#071B37] focus:outline-none focus:border-[#071B37]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#071B37] mb-1">
                Super Admin Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-[#071B37] focus:outline-none focus:border-[#071B37]"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#89190E] hover:bg-[#6e130b] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? 'Verifying...' : 'Unlock Examination Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
