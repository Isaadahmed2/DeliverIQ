'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('deliveriq_token') : null;
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <span className="w-4 h-4 rounded-full bg-indigo-500 animate-ping"></span>
        <span className="text-sm font-bold text-slate-300">Loading DeliverIQ...</span>
      </div>
    </div>
  );
}
