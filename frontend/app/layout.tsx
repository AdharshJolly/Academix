import './globals.css';
import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { AppProvider } from '../providers/AppProvider';
import { AppShell } from '../components/shared/AppShell';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CampusFlow - Academic Copilot',
  description: 'AI-powered academic management and workflow automation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="antialiased min-h-screen mesh-bg relative text-slate-100 flex flex-col">
        <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none z-0"></div>
        <AppProvider>
          <div className="relative z-10 flex-1 flex flex-col">
            <AppShell>{children}</AppShell>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
