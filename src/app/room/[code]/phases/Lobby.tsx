'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Users, Crown, ArrowRight, Lightbulb, Plus, Trash2, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useRoom } from '../RoomContext';
import { toast } from 'sonner';
import { useT } from '@/i18n/LanguageContext';
import { SavedIdeasPicker } from '@/components/SavedIdeasPicker';
import { useMutation } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { SpinWheelButton } from '../SpinWheelButton';

export function Lobby() {
  const { room, participants, suggestions, messages, session, isHost } = useRoom();
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const [newIdea, setNewIdea] = useState('');
  const [chatInput, setChatInput] = useState('');
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const inviteUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/room/${room.code}` : '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success(t.linkCopied);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPredefined = room.ideas_mode === 'predefined';

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => api.sendChatMessage(room.code, content, session.token),
    onSuccess: () => {
      setChatInput('');
      chatInputRef.current?.focus();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to send'),
  });

  const handleSend = () => {
    const trimmed = chatInput.trim();
    if (!trimmed || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(trimmed);
  };

  const addIdeaMutation = useMutation({
    mutationFn: (title: string) => api.addRoomSuggestion(room.code, title, session.token),
    onSuccess: () => setNewIdea(''),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to add'),
  });

  const removeIdeaMutation = useMutation({
    mutationFn: (id: string) => api.deleteRoomSuggestion(room.code, id, session.token),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to remove'),
  });

  const startRoomMutation = useMutation({
    mutationFn: (phase: string) => api.advancePhase(room.code, phase, session.token),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to start'),
  });

  return (
    <div className="flex flex-col gap-8 px-6 pt-16 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="mb-2 text-sm tracking-widest text-white/50 uppercase">{t.roomLabel}</p>
        <h1 className="text-4xl font-black text-white">{room.topic}</h1>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="text-xs text-white/40">{t.codeLabel}</span>
          <span className="font-mono text-lg font-bold tracking-widest text-white">
            {room.code}
          </span>
        </div>
      </motion.div>

      {/* Participants */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className=""
      >
        <div className="mb-4 flex items-center gap-2">
          <Users size={16} className="text-white/50" />
          <span className="text-sm tracking-widest text-white/50 uppercase">
            {t.waitingForFriends}
          </span>
        </div>

        <div className="space-y-3">
          {participants.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-sm font-bold text-white">
                {p.name[0].toUpperCase()}
              </div>
              <span className="font-medium text-white">{p.name}</span>
              {p.session_token === room.host_session_token && (
                <Crown size={14} className="ml-auto flex-shrink-0 text-amber-400" />
              )}
              {p.id === session.participantId && (
                <Badge variant="outline" className="ml-auto border-white/20 text-xs text-white/50">
                  {t.youBadge}
                </Badge>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Chat */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-white/50" />
          <span className="text-sm tracking-widest text-white/50 uppercase">{t.chatLabel}</span>
        </div>

        <div ref={chatContainerRef} className="max-h-48 overflow-y-auto rounded-2xl bg-white/5 p-3 space-y-2">
          {messages.length === 0 ? (
            <p className="py-2 text-center text-sm text-white/25">{t.chatEmptyState}</p>
          ) : (
            messages.map((msg) => {
              const isMe = msg.participant_id === session.participantId;
              const name = msg.participant?.name ?? participants.find((p) => p.id === msg.participant_id)?.name ?? '?';
              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-xs font-bold text-white">
                    {name[0].toUpperCase()}
                  </div>
                  <div className={`flex flex-col gap-0.5 max-w-[75%] ${isMe ? 'items-end' : ''}`}>
                    <span className="text-xs text-white/40">{name}</span>
                    <span className={`rounded-2xl px-3 py-1.5 text-sm text-white break-words ${isMe ? 'bg-violet-600/60' : 'bg-white/10'}`}>
                      {msg.content}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex gap-2">
          <Input
            ref={chatInputRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value.slice(0, 200))}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t.chatPlaceholder}
            className="flex-1 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/30"
            disabled={sendMessageMutation.isPending}
          />
          <button
            onClick={handleSend}
            disabled={sendMessageMutation.isPending || !chatInput.trim()}
            aria-label={t.chatSendAriaLabel}
            className="rounded-xl bg-violet-600 px-3 text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </motion.div>

      {/* Predefined ideas — editable for host, read-only for guests */}
      {isPredefined && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-white/50" />
            <span className="text-sm tracking-widest text-white/50 uppercase">
              {t.predefinedIdeasPreview}
            </span>
            <span className="ml-auto text-xs text-white/30">{suggestions.length}/20</span>
          </div>

          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {suggestions.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16, transition: { duration: 0.15 } }}
                  className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5"
                >
                  <span className="flex-1 text-sm text-white/80">{s.title}</span>
                  {isHost && (
                    <button
                      onClick={() => removeIdeaMutation.mutate(s.id)}
                      disabled={removeIdeaMutation.isPending}
                      className="flex-shrink-0 p-1 text-white/25 transition-colors hover:text-red-400 disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {suggestions.length === 0 && (
              <p className="py-2 text-center text-sm text-white/25">
                {t.predefinedIdeaPlaceholder}
              </p>
            )}
          </div>

          {isHost && suggestions.length < 20 && (
            <>
              <div className="flex gap-2">
                <Input
                  value={newIdea}
                  onChange={(e) => setNewIdea(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    newIdea.trim() &&
                    !addIdeaMutation.isPending &&
                    addIdeaMutation.mutate(newIdea.trim())
                  }
                  placeholder={t.predefinedIdeaPlaceholder}
                  className="flex-1 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/30"
                  maxLength={60}
                />
                <button
                  onClick={() => newIdea.trim() && addIdeaMutation.mutate(newIdea.trim())}
                  disabled={addIdeaMutation.isPending || !newIdea.trim()}
                  className="rounded-xl bg-violet-600 px-3 text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
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
        transition={{ delay: 0.25 }}
        className="space-y-3"
      >
        <button
          onClick={copyLink}
          disabled={copied}
          className="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-5 py-4 text-white transition-all hover:bg-white/15"
        >
          {copied ? (
            <Check size={18} className="text-green-400" />
          ) : (
            <Copy size={18} className="text-white/60" />
          )}
          <span className="flex-1 truncate text-left text-sm font-medium">{inviteUrl}</span>
        </button>

        {isHost ? (
          <>
            <Button
              onClick={() => {
                if (isPredefined) {
                  startRoomMutation.mutate(room.draw_type === 'challenge' ? 'challenge' : 'voting');
                } else {
                  startRoomMutation.mutate('submitting');
                }
              }}
              disabled={startRoomMutation.isPending || participants.length < 1}
              className="h-14 w-full rounded-2xl border-0 bg-gradient-to-r from-violet-600 to-purple-600 text-base font-bold text-white hover:from-violet-500 hover:to-purple-500"
            >
              {startRoomMutation.isPending ? (
                t.startingLabel
              ) : (
                <span className="flex items-center gap-2">
                  {isPredefined
                    ? room.draw_type === 'challenge'
                      ? t.startChallenge
                      : t.startVoting
                    : t.startEveryoneAdd}{' '}
                  <ArrowRight size={18} />
                </span>
              )}
            </Button>
            {isPredefined && room.draw_type === 'standard' && <SpinWheelButton />}
          </>
        ) : (
          <div className="py-2 text-center text-sm text-white/40">{t.waitingForHost}</div>
        )}
      </motion.div>
    </div>
  );
}
