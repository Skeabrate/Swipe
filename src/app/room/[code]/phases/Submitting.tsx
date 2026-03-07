'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRoom } from '../RoomContext';
import { toast } from 'sonner';
import { useT } from '@/i18n/LanguageContext';
import { SavedIdeasPicker } from '@/components/SavedIdeasPicker';
import { useMutation } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { SpinWheelButton } from '../SpinWheelButton';

export function Submitting() {
  const { room, participants, suggestions, session, isHost } = useRoom();
  const { t } = useT();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const mySuggestions = suggestions.filter((s) => s.participant_id === session.participantId);
  const me = participants.find((p) => p.id === session.participantId);
  const readyCount = participants.filter((p) => p.is_ready).length;
  const canAdd = !me?.is_ready && mySuggestions.length < room.max_suggestions;

  const addSuggestionMutation = useMutation({
    mutationFn: (title: string) => api.addRoomSuggestion(room.code, title, session.token),
    onSuccess: () => {
      setInput('');
      inputRef.current?.focus();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to add'),
  });

  const deleteSuggestionMutation = useMutation({
    mutationFn: (id: string) => api.deleteRoomSuggestion(room.code, id, session.token),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to delete'),
  });

  const markReadyMutation = useMutation({
    mutationFn: () => api.markReady(room.code, session.token),
    onSuccess: (data) => {
      if (data?.reason === 'no_suggestions') {
        toast.error(t.cantStartNoSuggestions);
      }
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Error'),
  });

  const forceStartMutation = useMutation({
    mutationFn: () =>
      api.advancePhase(
        room.code,
        room.draw_type === 'challenge' ? 'challenge' : 'voting',
        session.token,
      ),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed'),
  });

  const handleAdd = (titleOverride?: string) => {
    const title = (titleOverride ?? input).trim();
    if (!title) return;
    addSuggestionMutation.mutate(title);
  };

  return (
    <div className="flex h-full flex-col gap-6 px-6 pt-16 pb-8">
      {/* Header */}
      <div>
        <p className="mb-1 text-xs tracking-widest text-white/50 uppercase">{room.topic}</p>
        <h2 className="text-3xl font-black text-white">{t.addYourPicks}</h2>
        <p className="mt-1 text-sm text-white/40">
          {t.addedCount(mySuggestions.length, room.max_suggestions)}
          {me?.is_ready && <span className="ml-2 text-green-400">· {t.youAreDone}</span>}
        </p>
      </div>

      {/* Progress */}
      <div className="flex flex-wrap items-center gap-2">
        {participants.map((p) => (
          <div
            key={p.id}
            title={p.name}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
              p.is_ready ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'
            }`}
          >
            {p.is_ready && <Check size={11} strokeWidth={3} />}
            {p.name}
          </div>
        ))}
        <span className="ml-1 text-xs text-white/30">
          {t.readyCount(readyCount, participants.length)}
        </span>
      </div>

      {/* My suggestions list */}
      <div className="min-h-0 flex-1 space-y-2 overflow-auto">
        <AnimatePresence initial={false}>
          {mySuggestions.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
              className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3"
            >
              <span className="flex-1 text-sm text-white">{s.title}</span>
              {!me?.is_ready && (
                <button
                  onClick={() => deleteSuggestionMutation.mutate(s.id)}
                  disabled={deleteSuggestionMutation.isPending}
                  className="p-1 text-white/30 transition-colors hover:text-red-400 disabled:opacity-40"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {mySuggestions.length === 0 && !me?.is_ready && (
          <p className="pt-4 text-center text-sm text-white/25">{t.nothingYet}</p>
        )}
      </div>

      {/* Saved ideas picker */}
      {canAdd && (
        <SavedIdeasPicker
          usedTitles={mySuggestions.map((s) => s.title)}
          onSelect={(title) => handleAdd(title)}
          label={t.savedIdeas}
          maxSelect={room.max_suggestions - mySuggestions.length}
        />
      )}

      {/* Input */}
      {canAdd && (
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !addSuggestionMutation.isPending && handleAdd()}
            placeholder={`e.g. ${room.topic === 'Movie night' || room.topic === 'Wieczór filmowy' ? 'Interstellar' : '...'}`}
            className="h-12 flex-1 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/30"
            maxLength={80}
          />
          <Button
            onClick={() => handleAdd()}
            disabled={addSuggestionMutation.isPending || !input.trim()}
            className="h-12 w-12 rounded-xl bg-violet-600 p-0 hover:bg-violet-500"
          >
            {addSuggestionMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={20} />
            )}
          </Button>
        </div>
      )}

      {/* Done / Force start */}
      <div className="space-y-2">
        {!me?.is_ready && (
          <Button
            onClick={() => markReadyMutation.mutate()}
            disabled={markReadyMutation.isPending}
            className="h-14 w-full rounded-2xl border-0 bg-gradient-to-r from-violet-600 to-purple-600 text-base font-bold text-white hover:from-violet-500 hover:to-purple-500"
          >
            {markReadyMutation.isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                {mySuggestions.length === 0 ? t.passingStartVoting : t.doneStartVoting}{' '}
                <ArrowRight size={18} />
              </span>
            )}
          </Button>
        )}

        {isHost &&
          !me?.is_ready &&
          participants.some((p) => p.id !== session.participantId && !p.is_ready) && (
            <button
              onClick={() => forceStartMutation.mutate()}
              disabled={forceStartMutation.isPending}
              className="w-full py-2 text-xs text-white/30 transition-colors hover:text-white/50"
            >
              {t.forceStartBtn}
            </button>
          )}

        {isHost && room.draw_type === 'standard' && <SpinWheelButton />}
      </div>
    </div>
  );
}
