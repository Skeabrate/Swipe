'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Users, Crown, ArrowRight, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRoom } from '../RoomContext';
import { toast } from 'sonner';
import { useT } from '@/i18n/LanguageContext';

export function Lobby() {
  const { room, participants, session, isHost } = useRoom();
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${room.code}`
    : '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success(t.linkCopied);
    setTimeout(() => setCopied(false), 2000);
  };

  const startRoom = async () => {
    setStarting(true);
    const res = await fetch(`/api/rooms/${room.code}/phase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ phase: 'submitting' }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? 'Failed to start');
    }
    setStarting(false);
  };

  return (
    <div className="flex flex-col h-full px-6 pt-12 pb-8 gap-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-white/50 text-sm uppercase tracking-widest mb-2">{t.roomLabel}</p>
        <h1 className="text-white font-black text-4xl">{room.topic}</h1>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="text-white/40 text-xs">{t.codeLabel}</span>
          <span className="font-mono text-white font-bold tracking-widest text-lg">{room.code}</span>
        </div>
      </motion.div>

      {/* Participants */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 min-h-0"
      >
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-white/50" />
          <span className="text-white/50 text-sm uppercase tracking-widest">{t.waitingForFriends}</span>
        </div>

        <div className="space-y-3 overflow-auto max-h-full">
          {participants.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {p.name[0].toUpperCase()}
              </div>
              <span className="text-white font-medium">{p.name}</span>
              {p.session_token === room.host_session_token && (
                <Crown size={14} className="text-amber-400 ml-auto flex-shrink-0" />
              )}
              {p.id === session.participantId && (
                <Badge variant="outline" className="ml-auto text-white/50 border-white/20 text-xs">
                  {t.youBadge}
                </Badge>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Invite & Start */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <button
          onClick={copyLink}
          className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-2xl px-5 py-4 text-white transition-all"
        >
          {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-white/60" />}
          <span className="flex-1 text-left text-sm font-medium truncate">{inviteUrl}</span>
        </button>

        {isHost ? (
          <Button
            onClick={startRoom}
            disabled={starting || participants.length < 1}
            className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 border-0 text-white"
          >
            {starting ? t.startingLabel : (
              <span className="flex items-center gap-2">
                {t.startEveryoneAdd} <ArrowRight size={18} />
              </span>
            )}
          </Button>
        ) : (
          <div className="text-center text-white/40 text-sm py-2">
            {t.waitingForHost}
          </div>
        )}
      </motion.div>
    </div>
  );
}
