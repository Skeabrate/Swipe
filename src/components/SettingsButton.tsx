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
        className="fixed top-4 right-4 z-40 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
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
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(320px,calc(100vw-2rem))] bg-[#18181f] border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <h2 className="text-white font-black text-xl mb-5">{t.settingsTitle}</h2>

              <div>
                <p className="text-white/50 text-xs uppercase tracking-widest mb-3">{t.languageLabel}</p>
                <div className="space-y-2">
                  {LANGUAGES.map(({ code, flag, label }) => (
                    <button
                      key={code}
                      onClick={() => { setLang(code); setOpen(false); }}
                      className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                        lang === code
                          ? 'bg-violet-600/40 border border-violet-500/50 text-white'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent text-white/70'
                      }`}
                    >
                      <span className="text-2xl">{flag}</span>
                      <span className="font-medium">{label}</span>
                      {lang === code && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-violet-400" />
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
