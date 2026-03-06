'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Plus, Users, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { saveSession } from '@/lib/session';
import { toast } from 'sonner';
import { useT } from '@/i18n/LanguageContext';

type Mode = 'home' | 'create' | 'join';

export default function Home() {
  const router = useRouter();
  const { t } = useT();
  const [mode, setMode] = useState<Mode>('home');

  // Create form
  const [createName, setCreateName] = useState('');
  const [topic, setTopic] = useState('');
  const [maxSuggestions, setMaxSuggestions] = useState(10);
  const [anonymous, setAnonymous] = useState(true);
  const [creating, setCreating] = useState(false);

  // Join form
  const [roomCode, setRoomCode] = useState('');

  const createRoom = async () => {
    if (!createName.trim() || !topic.trim()) return;
    setCreating(true);

    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: createName.trim(), topic: topic.trim(), maxSuggestions, anonymous }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? 'Failed to create room');
      setCreating(false);
      return;
    }

    saveSession({
      token: data.sessionToken,
      participantId: data.participant.id,
      roomCode: data.room.code,
      name: createName.trim(),
    });

    router.push(`/room/${data.room.code}`);
  };

  const joinRoom = () => {
    const code = roomCode.trim().toUpperCase();
    if (code.length < 6) return;
    router.push(`/room/${code}`);
  };

  return (
    <main className="h-dvh bg-[#0a0a0f] overflow-hidden">
      <AnimatePresence mode="wait">
        {mode === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full px-6 pb-12 justify-between"
          >
            {/* Logo area */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 20 }}
                className="text-center"
              >
                <h1 className="text-white font-black text-7xl tracking-tighter">Swipe</h1>
                <p className="text-white/40 text-base mt-1">{t.subtitle}</p>
              </motion.div>

              {/* Decorative card stack */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative w-52 h-36 mt-2"
              >
                {[
                  { g: 'from-rose-500 to-pink-800', r: '-8deg', s: 0.92, z: 1 },
                  { g: 'from-blue-600 to-indigo-800', r: '4deg', s: 0.96, z: 2 },
                  { g: 'from-violet-600 to-purple-800', r: '-1deg', s: 1, z: 3 },
                ].map(({ g, r, s, z }, i) => (
                  <div
                    key={i}
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${g} shadow-xl`}
                    style={{ transform: `rotate(${r}) scale(${s})`, zIndex: z }}
                  />
                ))}
              </motion.div>
            </div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <Button
                onClick={() => setMode('create')}
                className="w-full h-16 text-lg font-bold rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 border-0 text-white gap-3"
              >
                <Plus size={22} /> {t.createRoom}
              </Button>
              <Button
                onClick={() => setMode('join')}
                variant="outline"
                className="w-full h-16 text-lg font-bold rounded-2xl bg-white/5 hover:bg-white/10 border-white/15 text-white gap-3"
              >
                <Users size={22} /> {t.joinWithCode}
              </Button>
            </motion.div>
          </motion.div>
        )}

        {mode === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full px-6 pt-12 pb-8 gap-6 overflow-auto"
          >
            <div className="flex items-center gap-3">
              <button onClick={() => setMode('home')} className="text-white/40 hover:text-white transition-colors p-1 -ml-1">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-white font-black text-2xl">{t.newRoomHeading}</h2>
            </div>

            <div className="flex-1 space-y-5 overflow-auto pb-1">
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">{t.yourName}</Label>
                <Input
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl h-13"
                  maxLength={30}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 text-sm">{t.whatDeciding}</Label>
                <Input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createRoom()}
                  placeholder={t.topicPlaceholder}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl h-13"
                  maxLength={60}
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {t.topicChips.map(chip => (
                    <button
                      key={chip}
                      onClick={() => setTopic(chip)}
                      className="text-white/40 hover:text-white/80 text-xs bg-white/5 hover:bg-white/10 rounded-full px-3 py-1.5 transition-all border border-white/10"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 bg-white/5 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <Label className="text-white/70 text-sm">{t.maxSuggestionsLabel}</Label>
                  <span className="text-white font-bold">{maxSuggestions}</span>
                </div>
                <Slider
                  value={[maxSuggestions]}
                  onValueChange={([v]) => setMaxSuggestions(v)}
                  min={1} max={20} step={1}
                />
                <div className="flex justify-between text-white/25 text-xs">
                  <span>1</span><span>20</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-4">
                <div>
                  <p className="text-white font-medium text-sm">{t.anonymousVoting}</p>
                  <p className="text-white/40 text-xs mt-0.5">{t.anonymousVotingDesc}</p>
                </div>
                <Switch checked={anonymous} onCheckedChange={setAnonymous} />
              </div>
            </div>

            <Button
              onClick={createRoom}
              disabled={creating || !createName.trim() || !topic.trim()}
              className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 border-0 text-white flex-shrink-0"
            >
              {creating ? <Loader2 size={20} className="animate-spin" /> : (
                <span className="flex items-center gap-2">{t.createRoomBtn} <ArrowRight size={18} /></span>
              )}
            </Button>
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div
            key="join"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full px-6 pt-12 pb-8 justify-between"
          >
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <button onClick={() => setMode('home')} className="text-white/40 hover:text-white transition-colors p-1 -ml-1">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-white font-black text-2xl">{t.joinARoomHeading}</h2>
              </div>

              <div className="space-y-3">
                <Label className="text-white/60 text-sm">{t.roomCodeLabel}</Label>
                <Input
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && joinRoom()}
                  placeholder="ABC123"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl h-16 font-mono text-2xl tracking-[0.3em] text-center"
                  maxLength={6}
                  autoFocus
                />
                <p className="text-white/30 text-xs text-center">
                  {t.roomCodeHint}
                </p>
              </div>
            </div>

            <Button
              onClick={joinRoom}
              disabled={roomCode.trim().length < 6}
              className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 border-0 text-white"
            >
              <span className="flex items-center gap-2">{t.findRoom} <ArrowRight size={18} /></span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
