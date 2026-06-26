'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../contexts/AuthContext';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isAuthPage = pathname === '/auth' || pathname === '/';

  useEffect(() => {
    if (isLoading) return; // Wait for hydration

    // Only redirect if we are NOT on an auth page and there's no user
    if (!user && !isAuthPage) {
      router.push('/auth');
    }
    // If logged in and hitting root or auth page, redirect to dashboard
    if (user && (pathname === '/' || pathname === '/auth')) {
      router.push('/dashboard');
    }
  }, [user, isLoading, isAuthPage, pathname, router]);

  // Auth page: render without sidebar/header
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Protected routes: render with shell
  return (
    <div className="flex h-screen overflow-hidden p-4 md:p-8 gap-8 max-w-[1600px] mx-auto w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-vintage-paper rounded-2xl shadow-lg border border-vintage-ink/5 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-vintage-paper">
          {children}
        </main>
      </div>
    </div>
  );
}
