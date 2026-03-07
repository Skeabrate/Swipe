'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home } from 'lucide-react';
import { LanguageProvider } from '@/i18n/LanguageContext';
import { SettingsButton } from './SettingsButton';
import { FeedbackButton } from './FeedbackButton';
import { useT } from '@/i18n/LanguageContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useVersionCheck } from '@/hooks/useVersionCheck';

function VersionCheck() {
  useVersionCheck();
  return null;
}

function HomeButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useT();

  if (pathname === '/') return null;

  return (
    <button
      onClick={() => router.push('/')}
      className="fixed top-4 left-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 transition-all hover:bg-white/20 hover:text-white"
      aria-label={t.goHome}
    >
      <Home size={18} />
    </button>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <VersionCheck />
        {children}
        <HomeButton />
        <FeedbackButton />
        <SettingsButton />
      </LanguageProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
