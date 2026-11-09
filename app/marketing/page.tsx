'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MarketingRootPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const user = localStorage.getItem('msi_marketing_user');
      if (user) {
        router.replace('/marketing/dashboard');
      } else {
        router.replace('/marketing/login');
      }
    } catch {
      router.replace('/marketing/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FFF9EF] flex items-center justify-center">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#89190E] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-600">Connecting to Marketing Portal...</span>
      </div>
    </div>
  );
}

