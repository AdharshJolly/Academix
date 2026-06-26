'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  React.useEffect(() => {
    // Immediately redirect to /auth on load — AppShell will handle if already logged in
    router.replace('/auth');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-neonBlue border-t-transparent animate-spin"></div>
        <p className="text-slate-400 text-sm">Loading Academix...</p>
      </div>
    </div>
  );
}
