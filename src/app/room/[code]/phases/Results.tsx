'use client';

import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRoom } from '../RoomContext';
import { SuggestionScore } from '@/types';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/LanguageContext';

export function Results() {
  const { room, suggestions, votes, tiebreakerPicks, participants } = useRoom();
  const router = useRouter();
  const { t } = useT();
  const confettiFired = useRef(false);

  // Wheel or challenge mode — skip vote-based scoring
  const isChallengeMode = room.draw_type === 'challenge';
  const isWheelMode = !!room.wheel_winner_id && !isChallengeMode;

  const wheelWinner = useMemo((): SuggestionScore | null => {
    if (!room.wheel_winner_id) return null;
    const s = suggestions.find((s) => s.id === room.wheel_winner_id);
    return s ? { suggestion: s, likes: 0 } : null;
  }, [room.wheel_winner_id, suggestions]);

  const challengeWinner = useMemo((): SuggestionScore | null => {
    if (!isChallengeMode || !room.wheel_winner_id) return null;
    const s = suggestions.find((s) => s.id === room.wheel_winner_id);
    return s ? { suggestion: s, likes: 0 } : null;
  }, [isChallengeMode, room.wheel_winner_id, suggestions]);

  // Build scores
  const scores: SuggestionScore[] = useMemo(() => {
    if (isWheelMode || isChallengeMode) return suggestions.map((s) => ({ suggestion: s, likes: 0 }));
    const map: Record<string, number> = {};
    for (const s of suggestions) map[s.id] = 0;
    for (const v of votes) {
      if (v.liked) map[v.suggestion_id] = (map[v.suggestion_id] ?? 0) + 1;
    }
    for (const p of tiebreakerPicks) {
      map[p.suggestion_id] = (map[p.suggestion_id] ?? 0) + 1;
    }
    return suggestions
      .map((s) => ({ suggestion: s, likes: map[s.id] ?? 0 }))
      .sort((a, b) => b.likes - a.likes);
  }, [suggestions, votes, tiebreakerPicks, isWheelMode, isChallengeMode]);

  // Determine winner
  const winner = useMemo((): SuggestionScore | null => {
    if (isChallengeMode) return challengeWinner;
    if (isWheelMode) return wheelWinner;
    if (scores.length === 0) return null;

    const maxScore = scores[0].likes;
    const topTied = scores.filter((s) => s.likes === maxScore);

    if (topTied.length === 1) return topTied[0];

    // Use tiebreaker picks
    if (tiebreakerPicks.length > 0) {
      const pickCount: Record<string, number> = {};
      for (const p of tiebreakerPicks) {
        pickCount[p.suggestion_id] = (pickCount[p.suggestion_id] ?? 0) + 1;
      }
      const maxPicks = Math.max(...Object.values(pickCount));
      const topPicked = topTied.filter((s) => (pickCount[s.suggestion.id] ?? 0) === maxPicks);

      if (topPicked.length === 1) return topPicked[0];

      // Still tied – random but deterministic (use room id)
      const idx = room.id.charCodeAt(0) % topPicked.length;
      return topPicked[idx];
    }

    // No tiebreaker data – random deterministic
    const idx = room.id.charCodeAt(0) % topTied.length;
    return topTied[idx];
  }, [scores, tiebreakerPicks, room.id, isWheelMode, wheelWinner, isChallengeMode, challengeWinner]);

  useEffect(() => {
    if (winner && !confettiFired.current) {
      confettiFired.current = true;
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#a855f7', '#7c3aed', '#ec4899', '#f59e0b'],
        });
        setTimeout(
          () => confetti({ particleCount: 60, spread: 60, origin: { y: 0.55 }, angle: 60 }),
          300,
        );
        setTimeout(
          () => confetti({ particleCount: 60, spread: 60, origin: { y: 0.55 }, angle: 120 }),
          500,
        );
      });
    }
  }, [winner]);

  const totalVoters = participants.length;

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto px-6 pt-16 pb-8">
      {/* Winner */}
      {winner && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          className="text-center"
        >
          <div className="mb-3 flex items-center justify-center gap-2">
            <Trophy size={20} className="text-amber-400" />
            <span className="text-sm font-bold tracking-widest text-amber-400 uppercase">
              {t.winnerLabel}
            </span>
          </div>

          <div className="relative rounded-3xl bg-gradient-to-br from-violet-600 to-purple-800 p-8 shadow-2xl shadow-violet-500/30">
            <div className="absolute -top-3 -right-3 text-3xl">{isChallengeMode ? '⚔️' : isWheelMode ? '🎡' : '🏆'}</div>
            <p className="text-4xl leading-tight font-black text-white">
              {winner.suggestion.title}
            </p>
            {!room.anonymous && winner.suggestion.participant && (
              <p className="mt-3 text-sm text-white/50">
                {t.byAuthor(winner.suggestion.participant.name)}
              </p>
            )}
            {isChallengeMode ? (
              <p className="mt-4 text-sm text-white/60">{t.wonTheBracket}</p>
            ) : isWheelMode ? (
              <p className="mt-4 text-sm text-white/60">{t.chosenByWheel} 🎡</p>
            ) : (
              <p className="mt-4 text-sm text-white/60">
                {t.likesOutOf(winner.likes, totalVoters)}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {scores.length === 0 && (
        <div className="py-8 text-center text-white/50">{t.noSuggestions}</div>
      )}

      {/* Full ranking */}
      {scores.length > 1 && (
        <div>
          <p className="mb-3 text-xs tracking-widest text-white/40 uppercase">{t.allPicks}</p>
          <div className="space-y-2">
            {scores.map(({ suggestion, likes }, i) => {
              const dislikes = votes.filter(
                (v) => v.suggestion_id === suggestion.id && !v.liked,
              ).length;
              const isWinner = suggestion.id === winner?.suggestion.id;

              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                    isWinner ? 'border border-violet-500/30 bg-violet-500/20' : 'bg-white/5'
                  }`}
                >
                  <span className="w-5 flex-shrink-0 text-right text-sm text-white/30">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-white">{suggestion.title}</span>
                  {!isWheelMode && !isChallengeMode && (
                    <div className="flex flex-shrink-0 items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-green-400">
                        <ThumbsUp size={12} /> {likes}
                      </span>
                      <span className="flex items-center gap-1 text-red-400">
                        <ThumbsDown size={12} /> {dislikes}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Play again */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        <Button
          onClick={() => router.push('/')}
          className="h-14 w-full rounded-2xl border-white/20 bg-white/10 text-base font-bold text-white hover:bg-white/15"
          variant="outline"
        >
          {t.newRoom}
        </Button>
      </motion.div>
    </div>
  );
}
