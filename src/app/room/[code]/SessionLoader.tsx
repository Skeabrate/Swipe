'use client';

// This client component reads localStorage and decides whether to show
// the JoinGate or the actual room.

import { useEffect, useState } from 'react';
import { loadSession } from '@/lib/session';
import { Room, Participant, Suggestion, Vote, TiebreakerPick, ChallengeMatch, ChallengeVote, RoomMessage, LocalSession } from '@/types';
import { JoinGate } from './JoinGate';
import { RoomProvider } from './RoomProvider';
import { RoomShell } from './RoomShell';

interface InitialData {
  room: Room;
  participants: Participant[];
  suggestions: Suggestion[];
  votes: Vote[];
  tiebreakerPicks: TiebreakerPick[];
  challengeMatches: ChallengeMatch[];
  challengeVotes: ChallengeVote[];
  messages: RoomMessage[];
}

interface Props {
  initialData: InitialData;
}

export function SessionLoader({ initialData }: Props) {
  const { room } = initialData;
  const [session, setSession] = useState<LocalSession | null | 'loading'>('loading');

  useEffect(() => {
    const s = loadSession(room.code);
    // Validate participant still exists in the room
    if (s && initialData.participants.some((p) => p.id === s.participantId)) {
      setSession(s);
    } else {
      setSession(null);
    }
  }, [room.code, initialData.participants]);

  if (session === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
      </div>
    );
  }

  if (!session) {
    if (room.phase !== 'lobby') {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="text-4xl">🔒</p>
          <h2 className="text-2xl font-black text-white">Room in progress</h2>
          <p className="text-white/50">This room has already started. You can't join now.</p>
        </div>
      );
    }
    return <JoinGate roomCode={room.code} topic={room.topic} />;
  }

  return (
    <RoomProvider initial={initialData} session={session}>
      <RoomShell />
    </RoomProvider>
  );
}
