"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useRoom } from "../RoomContext";
import { SuggestionScore } from "@/types";
import { toast } from "sonner";
import { useT } from "@/i18n/LanguageContext";
import { useMutation } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function Tiebreaker() {
  const { room, suggestions, votes, tiebreakerPicks, participants, session, myPick } = useRoom();
  const { t } = useT();

  // Compute tied suggestions (highest score)
  const scoreMap: Record<string, number> = {};
  for (const s of suggestions) scoreMap[s.id] = 0;
  for (const v of votes) {
    if (v.liked) scoreMap[v.suggestion_id] = (scoreMap[v.suggestion_id] ?? 0) + 1;
  }
  const maxScore = Math.max(...Object.values(scoreMap), 0);
  const tiedSuggestions = suggestions
    .filter((s) => (scoreMap[s.id] ?? 0) === maxScore)
    .map((s) => ({ suggestion: s, likes: scoreMap[s.id] ?? 0 }) as SuggestionScore);

  const pickedCount = tiebreakerPicks.length;
  const totalCount = participants.length;

  const pickMutation = useMutation({
    mutationFn: (suggestionId: string) => api.submitTiebreaker(room.code, suggestionId, session.token),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
  });

  return (
    <div className='flex flex-col h-full px-6 pt-16 pb-8 gap-6'>
      <div className='text-center'>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className='text-4xl mb-3'
        >
          🤝
        </motion.div>
        <h2 className='text-white font-black text-3xl'>{t.itsATie}</h2>
        <p className='text-white/50 mt-2 text-sm'>
          {t.tiedWith(tiedSuggestions.length, maxScore)}
          <br />
          {t.pickFavourite}
        </p>
      </div>

      {/* Progress */}
      <div className='flex justify-center gap-2'>
        {participants.map((p) => {
          const hasPicked = tiebreakerPicks.some((t) => t.participant_id === p.id);
          return (
            <div
              key={p.id}
              title={p.name}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                hasPicked ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"
              }`}
            >
              {hasPicked && (
                <Check
                  size={10}
                  strokeWidth={3}
                />
              )}
              {p.name}
            </div>
          );
        })}
      </div>

      {/* Tied suggestions */}
      <div className='flex-1 overflow-auto space-y-3'>
        {tiedSuggestions.map(({ suggestion }, i) => {
          const isMyPick = myPick?.suggestion_id === suggestion.id;
          const pickCount = tiebreakerPicks.filter((t) => t.suggestion_id === suggestion.id).length;

          return (
            <motion.button
              key={suggestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => !myPick && pickMutation.mutate(suggestion.id)}
              disabled={!!myPick || pickMutation.isPending}
              className={`w-full rounded-3xl p-6 text-left transition-all relative overflow-hidden ${
                isMyPick
                  ? "bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-500/30"
                  : myPick
                    ? "bg-white/5 opacity-60"
                    : "bg-white/10 hover:bg-white/15 active:scale-[0.98]"
              }`}
            >
              <p className='text-white font-bold text-xl'>{suggestion.title}</p>
              {!room.anonymous && suggestion.participant && (
                <p className='text-white/50 text-xs mt-1'>{t.byAuthor(suggestion.participant.name)}</p>
              )}
              {isMyPick && (
                <div className='absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center'>
                  <Check
                    size={14}
                    className='text-white'
                    strokeWidth={3}
                  />
                </div>
              )}
              {myPick && pickCount > 0 && <p className='text-white/40 text-xs mt-2'>{t.tiebreakerVotes(pickCount)}</p>}
            </motion.button>
          );
        })}
      </div>

      {myPick && pickedCount < totalCount && (
        <div className='text-center text-white/40 text-sm'>{t.waitingForMore(totalCount - pickedCount)}</div>
      )}

      {pickMutation.isPending && (
        <Loader2
          size={20}
          className='text-white/40 animate-spin mx-auto'
        />
      )}
    </div>
  );
}
