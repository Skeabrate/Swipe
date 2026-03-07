'use client';

import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { SwipeCard, SwipeActionButtons } from '@/components/SwipeCard';
import { useRoom } from '../RoomContext';
import { toast } from 'sonner';
import { useT } from '@/i18n/LanguageContext';
import { useMutation } from '@tanstack/react-query';
import * as api from '@/lib/api';

export function Voting() {
  const { room, participants, suggestions, myVotes, session, votes } = useRoom();
  const { t } = useT();

  // Shuffle suggestions once (stable across renders)
  const shuffledSuggestions = useMemo(() => {
    const copy = [...suggestions];
    // Deterministic shuffle using room id as seed (so all users see same order)
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.abs(room.id.charCodeAt(i % room.id.length) + i) % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [suggestions, room.id]);

  const votedIds = new Set(myVotes.map((v) => v.suggestion_id));
  const remaining = shuffledSuggestions.filter((s) => !votedIds.has(s.id));
  const totalVoters = participants.length;

  const progress = myVotes.length / shuffledSuggestions.length;

  const submitVoteMutation = useMutation({
    mutationFn: ({ suggestionId, liked }: { suggestionId: string; liked: boolean }) =>
      api.submitVote(room.code, suggestionId, liked, session.token),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Vote failed'),
  });

  const handleSwipe = useCallback(
    (liked: boolean) => {
      if (remaining.length === 0) return;
      submitVoteMutation.mutate({ suggestionId: remaining[0].id, liked });
    },
    [remaining, submitVoteMutation],
  );

  // Count unique voters who've cast at least one vote
  const votersDone = new Set(
    votes
      .filter((v) => {
        const votedSet = new Set(
          votes
            .filter((vv) => vv.participant_id === v.participant_id)
            .map((vv) => vv.suggestion_id),
        );
        return votedSet.size >= shuffledSuggestions.length;
      })
      .map((v) => v.participant_id),
  ).size;

  if (remaining.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="mb-4 text-5xl">✓</div>
          <h2 className="text-2xl font-black text-white">{t.youAreDoneVoting}</h2>
          <p className="mt-2 text-white/50">
            {votersDone < totalVoters
              ? t.waitingForMore(totalVoters - votersDone)
              : t.tallyingResults}
          </p>
          {votersDone < totalVoters && (
            <div className="mt-6 flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  className="h-2 w-2 rounded-full bg-violet-400"
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Progress bar */}
      <div className="flex-shrink-0 px-6 pt-16 pb-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs tracking-widest text-white/50 uppercase">{room.topic}</p>
          <p className="text-xs text-white/50">
            {myVotes.length} / {shuffledSuggestions.length}
          </p>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          />
        </div>
      </div>

      {/* Card stack */}
      <div className="relative min-h-0 flex-1 px-6">
        <AnimatePresence mode="sync">
          {remaining.slice(0, 3).map((suggestion, stackIndex) => (
            <SwipeCard
              key={suggestion.id}
              suggestion={suggestion}
              index={shuffledSuggestions.indexOf(suggestion)}
              stackIndex={stackIndex}
              anonymous={room.anonymous}
              onSwipe={stackIndex === 0 ? handleSwipe : () => {}}
            />
          ))}
        </AnimatePresence>

        {submitVoteMutation.isPending && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-white/30" />
          </div>
        )}
      </div>

      {/* Hint + buttons */}
      <div className="flex-shrink-0 space-y-4 px-6 pt-6 pb-10">
        <p className="text-center text-xs text-white/25">{t.swipeHint}</p>
        <SwipeActionButtons
          onDislike={() => handleSwipe(false)}
          onLike={() => handleSwipe(true)}
          disabled={submitVoteMutation.isPending}
        />
      </div>
    </div>
  );
}
