'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../contexts/AuthContext';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const isAuthPage = pathname === '/auth' || pathname === '/';

  useEffect(() => {
    // Only redirect if we are NOT on an auth page and there's no user
    if (!user && !isAuthPage) {
      router.push('/auth');
    }
    // If logged in and hitting root, redirect to dashboard
    if (user && pathname === '/') {
      router.push('/dashboard');
    }
  }, [user, isAuthPage, pathname, router]);

  // Auth page: render without sidebar/header
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Protected routes: render with shell
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
