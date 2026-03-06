'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home } from 'lucide-react';
import { LanguageProvider } from '@/i18n/LanguageContext';
import { SettingsButton } from './SettingsButton';
import { useT } from '@/i18n/LanguageContext';

function HomeButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useT();

  if (pathname === '/') return null;

  return (
    <button
      onClick={() => router.push('/')}
      className="fixed top-4 left-4 z-40 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
      aria-label={t.goHome}
    >
      <Home size={18} />
    </button>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
      <HomeButton />
      <SettingsButton />
    </LanguageProvider>
  );
}
