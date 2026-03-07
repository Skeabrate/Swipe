'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Plus, Users, ChevronLeft, BookOpen, History, X, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { saveSession, loadLastRoomCode } from '@/lib/session';
import { toast } from 'sonner';
import { useT } from '@/i18n/LanguageContext';
import { useUser, SignInButton, SignUpButton, UserButton, Show } from '@clerk/nextjs';
import { SavedIdeasPicker } from '@/components/SavedIdeasPicker';
import { useMutation } from '@tanstack/react-query';
import * as api from '@/lib/api';

type Mode = 'home' | 'create' | 'join';

export default function Home() {
  const router = useRouter();
  const { t } = useT();
  const { isSignedIn, user } = useUser();
  const [mode, setMode] = useState<Mode>('home');

  // Create form
  const [createName, setCreateName] = useState('');
  const [useCustomCreateName, setUseCustomCreateName] = useState(false);
  const [topic, setTopic] = useState('');
  const [maxSuggestions, setMaxSuggestions] = useState(10);
  const [anonymous, setAnonymous] = useState(false);
  const [ideasMode, setIdeasMode] = useState<'open' | 'predefined'>('open');
  const [drawType, setDrawType] = useState<'standard' | 'challenge'>('standard');
  const [predefinedIdeas, setPredefinedIdeas] = useState<string[]>([]);
  const [newIdea, setNewIdea] = useState('');

  // Join form
  const [roomCode, setRoomCode] = useState('');

  const [loginRequiredOpen, setLoginRequiredOpen] = useState(false);
  const [lastRoomCode, setLastRoomCode] = useState<string | null>(null);

  // Load latest room session from localStorage
  useEffect(() => {
    setLastRoomCode(loadLastRoomCode());
  }, []);

  // Auto-fill name when user is signed in
  useEffect(() => {
    if (isSignedIn && user) {
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || '';
      setCreateName(name);
    }
  }, [isSignedIn, user]);

  const createRoomMutation = useMutation({
    mutationFn: () =>
      api.createRoom({
        name: createName.trim(),
        topic: topic.trim(),
        maxSuggestions,
        anonymous,
        ideasMode,
        predefinedIdeas,
        drawType,
      }),
    onSuccess: (data) => {
      saveSession({
        token: data.sessionToken,
        participantId: data.participant.id,
        roomCode: data.room.code,
        name: createName.trim(),
      });
      router.push(`/room/${data.room.code}`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to create room'),
  });

  const joinRoom = () => {
    const code = roomCode.trim().toUpperCase();
    if (code.length < 6) return;
    router.push(`/room/${code}`);
  };

  return (
    <main className="h-dvh overflow-hidden bg-[#0a0a0f]">
      <AnimatePresence mode="wait">
        {mode === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="flex h-full flex-col justify-between px-6 pb-12"
          >
            {/* Auth area — h-10 + pt-4 matches the fixed settings cog position */}
            <div className="flex h-[56px] items-center justify-center pt-4">
              <Show when="signed-out">
                <div className="flex items-center gap-2">
                  <SignInButton mode="modal">
                    <button className="h-10 rounded-lg px-3 text-sm text-white/50 transition-colors hover:bg-white/10 hover:text-white">
                      {t.signIn}
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="h-10 rounded-lg bg-white/10 px-3 text-sm font-medium text-white transition-colors hover:bg-white/15">
                      {t.signUp}
                    </button>
                  </SignUpButton>
                </div>
              </Show>
              <Show when="signed-in">
                <UserButton
                  appearance={{
                    elements: { avatarBox: 'w-10 h-10', userButtonPopoverCard: 'mr-2' },
                  }}
                />
              </Show>
            </div>

            {/* Logo area */}
            <div className="flex flex-1 flex-col items-center justify-center gap-6">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 20 }}
                className="text-center"
              >
                <h1 className="text-7xl font-black tracking-tighter text-white">Swipe</h1>
                <p className="mt-1 text-base text-white/40">{t.subtitle}</p>
              </motion.div>

              {/* Decorative card stack */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative mt-2 h-36 w-52"
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
                className="h-16 w-full gap-3 rounded-2xl border-0 bg-gradient-to-r from-violet-600 to-purple-600 text-lg font-bold text-white hover:from-violet-500 hover:to-purple-500"
              >
                <Plus size={22} /> {t.createRoom}
              </Button>
              <Button
                onClick={() => setMode('join')}
                variant="outline"
                className="h-16 w-full gap-3 rounded-2xl border-white/15 bg-white/5 text-lg font-bold text-white hover:bg-white/10"
              >
                <Users size={22} /> {t.joinWithCode}
              </Button>

              {/* Return to latest room */}
              {lastRoomCode && (
                <Button
                  onClick={() => router.push(`/room/${lastRoomCode}`)}
                  variant="outline"
                  className="h-12 w-full gap-2 rounded-2xl border-violet-500/30 bg-violet-500/10 text-sm font-medium text-violet-300 hover:bg-violet-500/20 hover:text-violet-200"
                >
                  <ArrowRight size={16} />
                  {t.returnToRoom} #{lastRoomCode}
                </Button>
              )}

              {/* Quick links — always visible, locked for guests */}
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={() => isSignedIn ? router.push('/profile') : setLoginRequiredOpen(true)}
                  variant="outline"
                  className="relative h-12 flex-1 gap-2 rounded-2xl border-white/15 bg-white/5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                >
                  {isSignedIn ? <BookOpen size={16} /> : <Lock size={16} className="text-white/40" />}
                  {t.myIdeas}
                </Button>
                <Button
                  onClick={() => isSignedIn ? router.push('/history') : setLoginRequiredOpen(true)}
                  variant="outline"
                  className="relative h-12 flex-1 gap-2 rounded-2xl border-white/15 bg-white/5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                >
                  {isSignedIn ? <History size={16} /> : <Lock size={16} className="text-white/40" />}
                  {t.history}
                </Button>
              </div>
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
            className="flex h-full flex-col gap-6 overflow-auto px-6 pt-12 pb-8"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMode('home')}
                className="-ml-1 p-1 text-white/40 transition-colors hover:text-white"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-black text-white">{t.newRoomHeading}</h2>
            </div>

            <div className="flex-1 space-y-5 overflow-auto pb-1">
              {isSignedIn ? (
                <div className="space-y-2">
                  <Label className="text-sm text-white/60">{t.yourName}</Label>
                  {!useCustomCreateName ? (
                    <div className="space-y-2">
                      <div className="flex h-13 items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4">
                        <UserButton
                          appearance={{
                            elements: { avatarBox: 'w-6 h-6', userButtonPopoverCard: 'mr-2' },
                          }}
                        />
                        <span className="font-medium text-white">{createName}</span>
                      </div>
                      <button
                        onClick={() => setUseCustomCreateName(true)}
                        className="text-xs text-white/40 transition-colors hover:text-white/60"
                      >
                        {t.useCustomName}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        placeholder={t.namePlaceholder}
                        className="h-13 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/30"
                        maxLength={30}
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          const name =
                            [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
                            user?.username ||
                            '';
                          setCreateName(name);
                          setUseCustomCreateName(false);
                        }}
                        className="text-xs text-white/40 transition-colors hover:text-white/60"
                      >
                        {t.useAccountName}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm text-white/60">{t.yourName}</Label>
                  <Input
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="h-13 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/30"
                    maxLength={30}
                    autoFocus
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm text-white/60">{t.whatDeciding}</Label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createRoomMutation.mutate()}
                  placeholder={t.topicPlaceholder}
                  className="h-13 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/30"
                  maxLength={60}
                  autoFocus={isSignedIn}
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {t.topicChips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setTopic(chip)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/40 transition-all hover:bg-white/10 hover:text-white/80"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ideas mode toggle */}
              <div className="space-y-3 rounded-2xl bg-white/5 px-4 py-4">
                <p className="text-sm text-white/70">{t.ideasModeLabel}</p>
                <div className="flex gap-2">
                  {(['open', 'predefined'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setIdeasMode(m)}
                      className={`flex-1 rounded-xl py-2 text-sm font-medium transition-all ${
                        ideasMode === m
                          ? 'bg-violet-600 text-white'
                          : 'bg-white/10 text-white/50 hover:bg-white/15 hover:text-white'
                      }`}
                    >
                      {m === 'open' ? t.ideasModeOpen : t.ideasModePredefined}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max suggestions slider — only for open mode */}
              {ideasMode === 'open' && (
                <div className="space-y-3 rounded-2xl bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-white/70">{t.maxSuggestionsLabel}</Label>
                    <span className="font-bold text-white">{maxSuggestions}</span>
                  </div>
                  <Slider
                    value={[maxSuggestions]}
                    onValueChange={([v]) => setMaxSuggestions(v)}
                    min={1}
                    max={20}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-white/25">
                    <span>1</span>
                    <span>20</span>
                  </div>
                </div>
              )}

              {/* Predefined ideas list */}
              {ideasMode === 'predefined' && (
                <div className="space-y-3 rounded-2xl bg-white/5 p-4">
                  <p className="text-sm text-white/70">
                    {t.predefinedIdeasLabel} ({predefinedIdeas.length}/20)
                  </p>

                  {/* Text input row */}
                  <div className="flex gap-2">
                    <Input
                      value={newIdea}
                      onChange={(e) => setNewIdea(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newIdea.trim() && predefinedIdeas.length < 20) {
                          setPredefinedIdeas((prev) => [...prev, newIdea.trim()]);
                          setNewIdea('');
                        }
                      }}
                      placeholder={t.predefinedIdeaPlaceholder}
                      className="flex-1 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/30"
                      maxLength={60}
                    />
                    <button
                      onClick={() => {
                        if (newIdea.trim() && predefinedIdeas.length < 20) {
                          setPredefinedIdeas((prev) => [...prev, newIdea.trim()]);
                          setNewIdea('');
                        }
                      }}
                      disabled={!newIdea.trim() || predefinedIdeas.length >= 20}
                      className="rounded-xl bg-violet-600 px-3 text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  {/* Saved ideas picker */}
                  {predefinedIdeas.length < 20 && (
                    <SavedIdeasPicker
                      usedTitles={predefinedIdeas}
                      onSelect={(title) => setPredefinedIdeas((prev) => [...prev, title])}
                      label={t.savedIdeas}
                    />
                  )}

                  {/* Added ideas list */}
                  {predefinedIdeas.length > 0 && (
                    <div className="max-h-40 space-y-2 overflow-auto">
                      {predefinedIdeas.map((idea, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2"
                        >
                          <span className="flex-1 truncate text-sm text-white">{idea}</span>
                          <button
                            onClick={() =>
                              setPredefinedIdeas((prev) => prev.filter((_, idx) => idx !== i))
                            }
                            className="flex-shrink-0 text-white/30 transition-colors hover:text-white/80"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-4">
                <div>
                  <p className="text-sm font-medium text-white">{t.anonymousVoting}</p>
                  <p className="mt-0.5 text-xs text-white/40">{t.anonymousVotingDesc}</p>
                </div>
                <Switch checked={anonymous} onCheckedChange={setAnonymous} />
              </div>

              {/* Draw type toggle */}
              <div className="space-y-3 rounded-2xl bg-white/5 px-4 py-4">
                <p className="text-sm text-white/70">{t.drawTypeLabel}</p>
                <div className="flex gap-2">
                  {(['standard', 'challenge'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDrawType(d)}
                      className={`flex flex-1 flex-col items-center rounded-xl py-2.5 text-sm font-medium transition-all ${
                        drawType === d
                          ? 'bg-violet-600 text-white'
                          : 'bg-white/10 text-white/50 hover:bg-white/15 hover:text-white'
                      }`}
                    >
                      <span>{d === 'standard' ? t.drawTypeStandard : t.drawTypeChallenge}</span>
                      <span className={`mt-0.5 text-xs font-normal ${drawType === d ? 'text-white/70' : 'text-white/30'}`}>
                        {d === 'standard' ? t.drawTypeStandardDesc : t.drawTypeChallengeDesc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={() => createRoomMutation.mutate()}
              disabled={
                createRoomMutation.isPending ||
                !createName.trim() ||
                !topic.trim() ||
                (ideasMode === 'predefined' && predefinedIdeas.length === 0)
              }
              className="h-14 w-full flex-shrink-0 rounded-2xl border-0 bg-gradient-to-r from-violet-600 to-purple-600 text-base font-bold text-white hover:from-violet-500 hover:to-purple-500"
            >
              {createRoomMutation.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {t.createRoomBtn} <ArrowRight size={18} />
                </span>
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
            className="flex h-full flex-col justify-between px-6 pt-12 pb-8"
          >
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMode('home')}
                  className="-ml-1 p-1 text-white/40 transition-colors hover:text-white"
                >
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-2xl font-black text-white">{t.joinARoomHeading}</h2>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-white/60">{t.roomCodeLabel}</Label>
                <Input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                  placeholder="ABC123"
                  className="h-16 rounded-xl border-white/20 bg-white/10 text-center font-mono text-2xl tracking-[0.3em] text-white placeholder:text-white/30"
                  maxLength={6}
                  autoFocus
                />
                <p className="text-center text-xs text-white/30">{t.roomCodeHint}</p>
              </div>
            </div>

            <Button
              onClick={joinRoom}
              disabled={roomCode.trim().length < 6}
              className="h-14 w-full rounded-2xl border-0 bg-gradient-to-r from-violet-600 to-purple-600 text-base font-bold text-white hover:from-violet-500 hover:to-purple-500"
            >
              <span className="flex items-center gap-2">
                {t.findRoom} <ArrowRight size={18} />
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login-required modal */}
      <AnimatePresence>
        {loginRequiredOpen && (
          <motion.div
            key="login-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 pb-6 px-6"
            onClick={() => setLoginRequiredOpen(false)}
          >
            <motion.div
              key="login-modal"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }}
              transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-sm rounded-3xl bg-[#16161f] border border-white/10 p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8">
                  <Lock size={20} className="text-white/60" />
                </div>
                <button
                  onClick={() => setLoginRequiredOpen(false)}
                  className="p-1 text-white/30 transition-colors hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">{t.loginRequiredTitle}</h3>
                <p className="text-sm text-white/50">{t.loginRequiredDesc}</p>
              </div>
              <div className="flex gap-2">
                <SignInButton mode="modal">
                  <button
                    onClick={() => setLoginRequiredOpen(false)}
                    className="flex-1 h-11 rounded-xl bg-violet-600 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                  >
                    {t.signIn}
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    onClick={() => setLoginRequiredOpen(false)}
                    className="flex-1 h-11 rounded-xl bg-white/10 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                  >
                    {t.signUp}
                  </button>
                </SignUpButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
