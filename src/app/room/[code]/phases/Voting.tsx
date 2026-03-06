'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { SwipeCard, SwipeActionButtons } from '@/components/SwipeCard';
import { useRoom } from '../RoomContext';
import { toast } from 'sonner';
import { useT } from '@/i18n/LanguageContext';

export function Voting() {
  const { room, participants, suggestions, myVotes, session } = useRoom();
  const { t } = useT();
  const [pending, setPending] = useState(false);

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

  const votedIds = new Set(myVotes.map(v => v.suggestion_id));
  const remaining = shuffledSuggestions.filter(s => !votedIds.has(s.id));
  const totalVoters = participants.length;
  const votedOnCurrentCard = remaining.length > 0 ? votedIds.has(remaining[0].id) : false;

  const progress = myVotes.length / shuffledSuggestions.length;

  const submitVote = useCallback(async (suggestionId: string, liked: boolean) => {
    setPending(true);
    const res = await fetch(`/api/rooms/${room.code}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ suggestionId, liked }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? 'Vote failed');
    }
    setPending(false);
  }, [room.code, session.token]);

  const handleSwipe = useCallback((liked: boolean) => {
    if (remaining.length === 0) return;
    submitVote(remaining[0].id, liked);
  }, [remaining, submitVote]);

  // Count unique voters who've cast at least one vote
  const { votes } = useRoom();
  const votersDone = new Set(
    votes
      .filter(v => {
        const votedSet = new Set(votes.filter(vv => vv.participant_id === v.participant_id).map(vv => vv.suggestion_id));
        return votedSet.size >= shuffledSuggestions.length;
      })
      .map(v => v.participant_id)
  ).size;

  if (remaining.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-white font-black text-2xl">{t.youAreDoneVoting}</h2>
          <p className="text-white/50 mt-2">
            {votersDone < totalVoters
              ? t.waitingForMore(totalVoters - votersDone)
              : t.tallyingResults}
          </p>
          {votersDone < totalVoters && (
            <div className="flex gap-1.5 justify-center mt-6">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  className="w-2 h-2 rounded-full bg-violet-400"
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="px-6 pt-10 pb-4 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <p className="text-white/50 text-xs uppercase tracking-widest">{room.topic}</p>
          <p className="text-white/50 text-xs">{myVotes.length} / {shuffledSuggestions.length}</p>
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          />
        </div>
      </div>

      {/* Card stack */}
      <div className="flex-1 relative px-6 min-h-0">
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

        {pending && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <Loader2 size={24} className="text-white/30 animate-spin" />
          </div>
        )}
      </div>

      {/* Hint + buttons */}
      <div className="flex-shrink-0 px-6 pb-10 pt-6 space-y-4">
        <p className="text-center text-white/25 text-xs">{t.swipeHint}</p>
        <SwipeActionButtons
          onDislike={() => handleSwipe(false)}
          onLike={() => handleSwipe(true)}
          disabled={pending}
        />
      </div>
    </div>
  );
}
