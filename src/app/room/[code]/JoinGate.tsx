"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSession } from "@/lib/session";
import { toast } from "sonner";
import { useT } from "@/i18n/LanguageContext";
import { useMutation } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { useUser, UserButton } from "@clerk/nextjs";

interface Props {
  roomCode: string;
  topic: string;
}

export function JoinGate({ roomCode, topic }: Props) {
  const { isSignedIn, user } = useUser();
  const accountName =
    isSignedIn && user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "" : "";
  const [useCustomName, setUseCustomName] = useState(false);
  const [customName, setCustomName] = useState("");
  const router = useRouter();
  const { t } = useT();

  const effectiveName = isSignedIn && !useCustomName ? accountName : customName;

  const joinMutation = useMutation({
    mutationFn: (name: string) => api.joinRoom(roomCode, name),
    onSuccess: (data, name) => {
      saveSession({
        token: data.sessionToken,
        participantId: data.participant.id,
        roomCode: roomCode.toUpperCase(),
        name,
      });
      router.refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to join"),
  });

  const handleJoin = () => {
    const name = effectiveName.trim();
    if (!name) return;
    joinMutation.mutate(name);
  };

  return (
    <div className='flex flex-col h-full items-center justify-center px-8 gap-8'>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center'
      >
        <p className='text-white/40 text-sm uppercase tracking-widest mb-2'>{t.joining}</p>
        <h1 className='text-white font-black text-4xl'>{topic}</h1>
        <p className='text-white/40 text-sm mt-2'>{t.roomCodeDisplay(roomCode)}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='w-full max-w-sm space-y-4'
      >
        <div className='space-y-2'>
          <Label className='text-white/60 text-sm'>{t.yourName}</Label>

          {isSignedIn && !useCustomName ? (
            <div className='space-y-2'>
              <div className='flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl h-14 px-4'>
                <UserButton appearance={{ elements: { avatarBox: "w-6 h-6", userButtonPopoverCard: "mr-2" } }} />
                <span className='text-white font-medium'>{accountName}</span>
              </div>
              <button
                onClick={() => setUseCustomName(true)}
                className='text-white/40 text-xs hover:text-white/60 transition-colors'
              >
                {t.useCustomName}
              </button>
            </div>
          ) : (
            <div className='space-y-2'>
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder='e.g. Alex'
                className='bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl h-14 text-lg'
                autoFocus
                maxLength={30}
              />
              {isSignedIn && (
                <button
                  onClick={() => setUseCustomName(false)}
                  className='text-white/40 text-xs hover:text-white/60 transition-colors'
                >
                  {t.useAccountName}
                </button>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={handleJoin}
          disabled={joinMutation.isPending || !effectiveName.trim()}
          className='w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 border-0 text-white'
        >
          {joinMutation.isPending ? (
            <Loader2
              size={20}
              className='animate-spin'
            />
          ) : (
            <span className='flex items-center gap-2'>
              {t.joinRoomBtn} <ArrowRight size={18} />
            </span>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
