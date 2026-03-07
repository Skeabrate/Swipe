'use client';

import { useState } from 'react';
import { Bug, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { FEEDBACK_TYPES, type FeedbackType } from '@/lib/feedback';
import { useT } from '@/i18n/LanguageContext';

export function FeedbackButton() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>(FEEDBACK_TYPES[0]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message }),
      });
      if (!res.ok) throw new Error('Failed to send');
      toast.success(t.feedbackSuccess);
      setMessage('');
      setType(FEEDBACK_TYPES[0]);
      setOpen(false);
    } catch {
      toast.error(t.feedbackError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-16 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 transition-all hover:bg-white/20 hover:text-white"
        aria-label={t.feedbackAriaLabel}
      >
        <Bug size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="fixed top-1/2 left-1/2 z-50 w-[min(360px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-[#18181f] p-6 shadow-2xl"
            >
              <h2 className="mb-5 text-xl font-black text-white">{t.feedbackTitle}</h2>

              <div className="mb-4">
                <p className="mb-3 text-xs tracking-widest text-white/50 uppercase">
                  {t.feedbackTypeLabel}
                </p>
                <div className="space-y-2">
                  {FEEDBACK_TYPES.map((fbType) => (
                    <button
                      key={fbType}
                      onClick={() => setType(fbType)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                        type === fbType
                          ? 'border border-violet-500/50 bg-violet-600/40 text-white'
                          : 'border border-transparent bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <span className="font-medium">{t.feedbackTypes[fbType]}</span>
                      {type === fbType && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-violet-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <p className="mb-3 text-xs tracking-widest text-white/50 uppercase">
                  {t.feedbackMessageLabel}
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.feedbackMessagePlaceholder}
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white transition-colors placeholder:text-white/30 focus:border-violet-500/60 focus:outline-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !message.trim()}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 font-bold text-white transition-all hover:from-violet-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : t.feedbackSend}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
