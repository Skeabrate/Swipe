import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/Providers';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'Swipe — Decide together',
  description: 'A fun way for friends to decide on movies, restaurants, activities and more.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Swipe',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.variable} font-sans antialiased h-full bg-[#0a0a0f] text-white`}>
        <Providers>
          {children}
          <Toaster theme="dark" position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
