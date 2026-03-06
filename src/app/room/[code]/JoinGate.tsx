'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveSession } from '@/lib/session';
import { toast } from 'sonner';
import { useT } from '@/i18n/LanguageContext';

interface Props {
  roomCode: string;
  topic: string;
}

export function JoinGate({ roomCode, topic }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useT();

  const join = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);

    const res = await fetch(`/api/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? 'Failed to join');
      setLoading(false);
      return;
    }

    saveSession({
      token: data.sessionToken,
      participantId: data.participant.id,
      roomCode: roomCode.toUpperCase(),
      name: trimmed,
    });

    // Refresh server component
    router.refresh();
  };

  return (
    <div className="flex flex-col h-full items-center justify-center px-8 gap-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-white/40 text-sm uppercase tracking-widest mb-2">{t.joining}</p>
        <h1 className="text-white font-black text-4xl">{topic}</h1>
        <p className="text-white/40 text-sm mt-2">{t.roomCodeDisplay(roomCode)}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm space-y-4"
      >
        <div className="space-y-2">
          <Label className="text-white/60 text-sm">{t.yourName}</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && join()}
            placeholder="e.g. Alex"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl h-14 text-lg"
            autoFocus
            maxLength={30}
          />
        </div>

        <Button
          onClick={join}
          disabled={loading || !name.trim()}
          className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 border-0 text-white"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <span className="flex items-center gap-2">{t.joinRoomBtn} <ArrowRight size={18} /></span>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
