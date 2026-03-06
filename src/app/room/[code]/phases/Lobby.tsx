"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Users, Crown, ArrowRight, Lightbulb, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRoom } from "../RoomContext";
import { toast } from "sonner";
import { useT } from "@/i18n/LanguageContext";
import { SavedIdeasPicker } from "@/components/SavedIdeasPicker";
import { useMutation } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function Lobby() {
  const { room, participants, suggestions, session, isHost } = useRoom();
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const [newIdea, setNewIdea] = useState("");

  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/room/${room.code}` : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success(t.linkCopied);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPredefined = room.ideas_mode === "predefined";

  const addIdeaMutation = useMutation({
    mutationFn: (title: string) => api.addRoomSuggestion(room.code, title, session.token),
    onSuccess: () => setNewIdea(""),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add"),
  });

  const removeIdeaMutation = useMutation({
    mutationFn: (id: string) => api.deleteRoomSuggestion(room.code, id, session.token),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to remove"),
  });

  const startRoomMutation = useMutation({
    mutationFn: (phase: string) => api.advancePhase(room.code, phase, session.token),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to start"),
  });

  return (
    <div className='flex flex-col h-full px-6 pt-16 pb-8 gap-8'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center'
      >
        <p className='text-white/50 text-sm uppercase tracking-widest mb-2'>{t.roomLabel}</p>
        <h1 className='text-white font-black text-4xl'>{room.topic}</h1>
        <div className='flex items-center justify-center gap-2 mt-3'>
          <span className='text-white/40 text-xs'>{t.codeLabel}</span>
          <span className='font-mono text-white font-bold tracking-widest text-lg'>{room.code}</span>
        </div>
      </motion.div>

      {/* Participants */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='flex-1 min-h-0'
      >
        <div className='flex items-center gap-2 mb-4'>
          <Users
            size={16}
            className='text-white/50'
          />
          <span className='text-white/50 text-sm uppercase tracking-widest'>{t.waitingForFriends}</span>
        </div>

        <div className='space-y-3 overflow-auto max-h-full'>
          {participants.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className='flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3'
            >
              <div className='w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0'>
                {p.name[0].toUpperCase()}
              </div>
              <span className='text-white font-medium'>{p.name}</span>
              {p.session_token === room.host_session_token && (
                <Crown
                  size={14}
                  className='text-amber-400 ml-auto flex-shrink-0'
                />
              )}
              {p.id === session.participantId && (
                <Badge
                  variant='outline'
                  className='ml-auto text-white/50 border-white/20 text-xs'
                >
                  {t.youBadge}
                </Badge>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Predefined ideas — editable for host, read-only for guests */}
      {isPredefined && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className='space-y-3'
        >
          <div className='flex items-center gap-2'>
            <Lightbulb
              size={16}
              className='text-white/50'
            />
            <span className='text-white/50 text-sm uppercase tracking-widest'>{t.predefinedIdeasPreview}</span>
            <span className='text-white/30 text-xs ml-auto'>{suggestions.length}/20</span>
          </div>

          <div className='space-y-2 max-h-48 overflow-auto'>
            <AnimatePresence initial={false}>
              {suggestions.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16, transition: { duration: 0.15 } }}
                  className='flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2.5'
                >
                  <span className='flex-1 text-white/80 text-sm'>{s.title}</span>
                  {isHost && (
                    <button
                      onClick={() => removeIdeaMutation.mutate(s.id)}
                      className='text-white/25 hover:text-red-400 transition-colors p-1 flex-shrink-0'
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {suggestions.length === 0 && (
              <p className='text-white/25 text-sm text-center py-2'>{t.predefinedIdeaPlaceholder}</p>
            )}
          </div>

          {isHost && suggestions.length < 20 && (
            <>
              <div className='flex gap-2'>
                <Input
                  value={newIdea}
                  onChange={(e) => setNewIdea(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && newIdea.trim() && addIdeaMutation.mutate(newIdea.trim())}
                  placeholder={t.predefinedIdeaPlaceholder}
                  className='bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl flex-1'
                  maxLength={60}
                />
                <button
                  onClick={() => newIdea.trim() && addIdeaMutation.mutate(newIdea.trim())}
                  disabled={addIdeaMutation.isPending || !newIdea.trim()}
                  className='bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl px-3 transition-colors'
                >
                  <Plus size={18} />
                </button>
              </div>
              <SavedIdeasPicker
                usedTitles={suggestions.map((s) => s.title)}
                onSelect={(title) => addIdeaMutation.mutate(title)}
                label={t.savedIdeas}
              />
            </>
          )}
        </motion.div>
      )}

      {/* Invite & Start */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='space-y-3'
      >
        <button
          onClick={copyLink}
          className='w-full flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-2xl px-5 py-4 text-white transition-all'
        >
          {copied ? (
            <Check
              size={18}
              className='text-green-400'
            />
          ) : (
            <Copy
              size={18}
              className='text-white/60'
            />
          )}
          <span className='flex-1 text-left text-sm font-medium truncate'>{inviteUrl}</span>
        </button>

        {isHost ? (
          <Button
            onClick={() => startRoomMutation.mutate(isPredefined ? "voting" : "submitting")}
            disabled={startRoomMutation.isPending || participants.length < 1}
            className='w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 border-0 text-white'
          >
            {startRoomMutation.isPending ? (
              t.startingLabel
            ) : (
              <span className='flex items-center gap-2'>
                {isPredefined ? t.startVoting : t.startEveryoneAdd} <ArrowRight size={18} />
              </span>
            )}
          </Button>
        ) : (
          <div className='text-center text-white/40 text-sm py-2'>{t.waitingForHost}</div>
        )}
      </motion.div>
    </div>
  );
}
