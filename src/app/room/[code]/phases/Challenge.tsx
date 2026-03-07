'use client';

import { motion } from 'framer-motion';
import { Swords } from 'lucide-react';
import { useRoom } from '../RoomContext';
import { useT } from '@/i18n/LanguageContext';
import { useMutation } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { toast } from 'sonner';

const CARD_GRADIENTS = [
  'from-violet-600 to-purple-800',
  'from-blue-600 to-indigo-800',
  'from-rose-500 to-pink-800',
  'from-emerald-500 to-teal-800',
  'from-amber-500 to-orange-700',
  'from-sky-500 to-cyan-700',
  'from-fuchsia-500 to-purple-700',
  'from-lime-500 to-green-700',
];

export function Challenge() {
  const { room, participants, suggestions, challengeMatches, challengeVotes, currentMatch, myMatchVote, session } =
    useRoom();
  const { t } = useT();

  const totalMatchesInRound = currentMatch
    ? challengeMatches.filter((m) => m.round === currentMatch.round).length
    : 0;
  const matchNumberInRound = currentMatch
    ? challengeMatches
        .filter((m) => m.round === currentMatch.round)
        .sort((a, b) => a.match_index - b.match_index)
        .findIndex((m) => m.id === currentMatch.id) + 1
    : 0;

  const votedForThisMatch = currentMatch ? myMatchVote(currentMatch.id) : undefined;

  const votesThisMatch = currentMatch
    ? challengeVotes.filter((v) => v.match_id === currentMatch.id)
    : [];

  const suggestion1 = currentMatch
    ? suggestions.find((s) => s.id === currentMatch.suggestion_id_1)
    : undefined;
  const suggestion2 = currentMatch
    ? suggestions.find((s) => s.id === currentMatch.suggestion_id_2)
    : undefined;

  const voteMutation = useMutation({
    mutationFn: (suggestionId: string) =>
      api.submitChallengeVote(room.code, currentMatch!.id, suggestionId, session.token),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Vote failed'),
  });

  // No active match — waiting for next round to load or transitioning
  if (!currentMatch) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
      </div>
    );
  }

  const hasVoted = !!votedForThisMatch;
  const allVoted = votesThisMatch.length >= participants.length;

  return (
    <div className="flex h-full flex-col gap-6 px-6 pt-16 pb-8">
      {/* Header */}
      <motion.div
        key={currentMatch.id}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mb-1 flex items-center justify-center gap-2">
          <Swords size={16} className="text-violet-400" />
          <span className="text-sm font-bold tracking-widest text-violet-400 uppercase">
            {t.challengeRound(currentMatch.round)}
          </span>
        </div>
        <p className="text-xs text-white/40">
          {t.challengeMatch(matchNumberInRound, totalMatchesInRound)}
        </p>
      </motion.div>

      {/* Cards */}
      <motion.div
        key={`cards-${currentMatch.id}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-1 flex-col gap-3"
      >
        {[suggestion1, suggestion2].map((suggestion, idx) => {
          if (!suggestion) return null;
          const isChosen = votedForThisMatch?.suggestion_id === suggestion.id;
          const isOther = hasVoted && votedForThisMatch?.suggestion_id !== suggestion.id;
          const suggestionIndex = suggestions.findIndex((s) => s.id === suggestion.id);
          const gradient = CARD_GRADIENTS[suggestionIndex % CARD_GRADIENTS.length];

          return (
            <div key={suggestion.id} className="contents">
              <button
                onClick={() => !hasVoted && !voteMutation.isPending && voteMutation.mutate(suggestion.id)}
                disabled={hasVoted || voteMutation.isPending}
                className={`relative flex flex-1 items-center justify-center overflow-hidden rounded-3xl p-6 text-center transition-all ${
                  isOther
                    ? 'opacity-30'
                    : isChosen
                      ? 'scale-[1.02] shadow-2xl'
                      : 'hover:scale-[1.01] active:scale-[0.98]'
                } bg-gradient-to-br ${gradient}`}
              >
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/5" />
                <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/5" />
                <div className="relative z-10">
                  {isChosen && (
                    <div className="mb-3 flex justify-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                        <span className="text-sm font-black text-white">✓</span>
                      </div>
                    </div>
                  )}
                  <p className="text-2xl font-black leading-tight text-white drop-shadow">{suggestion.title}</p>
                  {!room.anonymous && suggestion.participant && (
                    <p className="mt-2 text-sm text-white/50">{suggestion.participant.name}</p>
                  )}
                </div>
              </button>
              {idx === 0 && (
                <div className="flex items-center justify-center">
                  <span className="text-xs font-bold tracking-widest text-white/20 uppercase">vs</span>
                </div>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Footer: vote status */}
      <div className="text-center text-sm text-white/40">
        {hasVoted
          ? allVoted
            ? null
            : t.challengeWaitingOthers
          : t.challengePickOne}
        {hasVoted && (
          <p className="mt-1 text-xs text-white/25">
            {t.challengeVoted(votesThisMatch.length, participants.length)}
          </p>
        )}
      </div>
    </div>
  );
}
