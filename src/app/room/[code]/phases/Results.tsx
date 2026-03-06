'use client';

import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRoom } from '../RoomContext';
import { SuggestionScore } from '@/types';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/LanguageContext';

export function Results() {
  const { room, suggestions, votes, tiebreakerPicks, participants, session } = useRoom();
  const router = useRouter();
  const { t } = useT();
  const confettiFired = useRef(false);

  // Build scores
  const scores: SuggestionScore[] = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of suggestions) map[s.id] = 0;
    for (const v of votes) {
      if (v.liked) map[v.suggestion_id] = (map[v.suggestion_id] ?? 0) + 1;
    }
    for (const p of tiebreakerPicks) {
      map[p.suggestion_id] = (map[p.suggestion_id] ?? 0) + 1;
    }
    return suggestions
      .map(s => ({ suggestion: s, likes: map[s.id] ?? 0 }))
      .sort((a, b) => b.likes - a.likes);
  }, [suggestions, votes, tiebreakerPicks]);

  // Determine winner
  const winner = useMemo((): SuggestionScore | null => {
    if (scores.length === 0) return null;

    const maxScore = scores[0].likes;
    const topTied = scores.filter(s => s.likes === maxScore);

    if (topTied.length === 1) return topTied[0];

    // Use tiebreaker picks
    if (tiebreakerPicks.length > 0) {
      const pickCount: Record<string, number> = {};
      for (const p of tiebreakerPicks) {
        pickCount[p.suggestion_id] = (pickCount[p.suggestion_id] ?? 0) + 1;
      }
      const maxPicks = Math.max(...Object.values(pickCount));
      const topPicked = topTied.filter(s => (pickCount[s.suggestion.id] ?? 0) === maxPicks);

      if (topPicked.length === 1) return topPicked[0];

      // Still tied – random but deterministic (use room id)
      const idx = room.id.charCodeAt(0) % topPicked.length;
      return topPicked[idx];
    }

    // No tiebreaker data – random deterministic
    const idx = room.id.charCodeAt(0) % topTied.length;
    return topTied[idx];
  }, [scores, tiebreakerPicks, room.id]);

  useEffect(() => {
    if (winner && !confettiFired.current) {
      confettiFired.current = true;
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ['#a855f7', '#7c3aed', '#ec4899', '#f59e0b'] });
        setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { y: 0.55 }, angle: 60 }), 300);
        setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { y: 0.55 }, angle: 120 }), 500);
      });
    }
  }, [winner]);

  const totalVoters = participants.length;

  return (
    <div className="flex flex-col h-full px-6 pt-16 pb-8 gap-6 overflow-auto">
      {/* Winner */}
      {winner && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy size={20} className="text-amber-400" />
            <span className="text-amber-400 text-sm font-bold uppercase tracking-widest">{t.winnerLabel}</span>
          </div>

          <div className="relative rounded-3xl bg-gradient-to-br from-violet-600 to-purple-800 p-8 shadow-2xl shadow-violet-500/30">
            <div className="absolute -top-3 -right-3 text-3xl">🏆</div>
            <p className="text-white font-black text-4xl leading-tight">{winner.suggestion.title}</p>
            {!room.anonymous && winner.suggestion.participant && (
              <p className="text-white/50 mt-3 text-sm">{t.byAuthor(winner.suggestion.participant.name)}</p>
            )}
            <p className="text-white/60 mt-4 text-sm">
              {t.likesOutOf(winner.likes, totalVoters)}
            </p>
          </div>
        </motion.div>
      )}

      {scores.length === 0 && (
        <div className="text-center text-white/50 py-8">{t.noSuggestions}</div>
      )}

      {/* Full ranking */}
      {scores.length > 1 && (
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">{t.allPicks}</p>
          <div className="space-y-2">
            {scores.map(({ suggestion, likes }, i) => {
              const dislikes = votes.filter(v => v.suggestion_id === suggestion.id && !v.liked).length;
              const isWinner = suggestion.id === winner?.suggestion.id;

              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                    isWinner ? 'bg-violet-500/20 border border-violet-500/30' : 'bg-white/5'
                  }`}
                >
                  <span className="text-white/30 text-sm w-5 text-right flex-shrink-0">{i + 1}</span>
                  <span className="flex-1 text-white text-sm font-medium">{suggestion.title}</span>
                  <div className="flex items-center gap-3 text-xs flex-shrink-0">
                    <span className="text-green-400 flex items-center gap-1">
                      <ThumbsUp size={12} /> {likes}
                    </span>
                    <span className="text-red-400 flex items-center gap-1">
                      <ThumbsDown size={12} /> {dislikes}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Play again */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          onClick={() => router.push('/')}
          className="w-full h-14 text-base font-bold rounded-2xl bg-white/10 hover:bg-white/15 border-white/20 text-white"
          variant="outline"
        >
          {t.newRoom}
        </Button>
      </motion.div>
    </div>
  );
}
