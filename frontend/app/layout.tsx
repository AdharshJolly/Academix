import './globals.css';
import type { Metadata } from 'next';
import { Space_Grotesk, Fraunces, Caveat, Courier_Prime } from 'next/font/google';
import { AppProvider } from '../providers/AppProvider';
import { AppShell } from '../components/shared/AppShell';
import { Toaster } from 'react-hot-toast';

const sansFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
});

const displayFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
});

const accentFont = Caveat({
  subsets: ['latin'],
  variable: '--font-accent',
});

const monoFont = Courier_Prime({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Academix - Academic Copilot',
  description: 'Your intelligent academic copilot.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sansFont.variable} ${displayFont.variable} ${accentFont.variable} ${monoFont.variable}`}>
      <body className="antialiased min-h-screen flex flex-col font-sans relative striped-bg overflow-x-hidden">
        
        {/* Playful Crimson Stars */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <svg width="48" height="48" className="absolute top-[8%] right-[10%] w-12 h-12 text-vintage-crimson rotate-12 drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <svg width="32" height="32" className="absolute top-[12%] right-[14%] w-8 h-8 text-vintage-crimson -rotate-12 drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <svg width="24" height="24" className="absolute top-[6%] right-[16%] w-6 h-6 text-vintage-crimson rotate-45 drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </div>

        <AppProvider>
          <div className="flex-1 flex flex-col relative z-10 w-full mx-auto h-screen">
            <AppShell>{children}</AppShell>
            <Toaster position="bottom-right" toastOptions={{
              className: 'font-mono text-sm border border-vintage-ink/10 shadow-sm rounded-md',
              style: {
                background: '#FDFBF7',
                color: '#1a1a1a',
              },
            }} />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
