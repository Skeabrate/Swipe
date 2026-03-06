'use client';

import { LanguageProvider } from '@/i18n/LanguageContext';
import { SettingsButton } from './SettingsButton';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
      <SettingsButton />
    </LanguageProvider>
  );
}
