'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '@/i18n/LanguageContext';
import type { Language } from '@/i18n/translations';

const LANGUAGES: { code: Language; flag: string; label: string }[] = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'pl', flag: '🇵🇱', label: 'Polski' },
];

export function SettingsButton() {
  const { lang, setLang, t } = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 transition-all hover:bg-white/20 hover:text-white"
        aria-label={t.settingsTitle}
      >
        <Settings size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Modal */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="fixed top-1/2 left-1/2 z-50 w-[min(320px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-[#18181f] p-6 shadow-2xl"
            >
              <h2 className="mb-5 text-xl font-black text-white">{t.settingsTitle}</h2>

              <div>
                <p className="mb-3 text-xs tracking-widest text-white/50 uppercase">
                  {t.languageLabel}
                </p>
                <div className="space-y-2">
                  {LANGUAGES.map(({ code, flag, label }) => (
                    <button
                      key={code}
                      onClick={() => {
                        setLang(code);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                        lang === code
                          ? 'border border-violet-500/50 bg-violet-600/40 text-white'
                          : 'border border-transparent bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-2xl">{flag}</span>
                      <span className="font-medium">{label}</span>
                      {lang === code && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-violet-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
