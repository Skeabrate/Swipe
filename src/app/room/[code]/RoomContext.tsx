'use client';

import { createContext, useContext } from 'react';
import { Room, Participant, Suggestion, Vote, TiebreakerPick, ChallengeMatch, ChallengeVote, RoomMessage, LocalSession } from '@/types';

export interface RoomContextValue {
  room: Room;
  participants: Participant[];
  suggestions: Suggestion[];
  votes: Vote[];
  tiebreakerPicks: TiebreakerPick[];
  challengeMatches: ChallengeMatch[];
  challengeVotes: ChallengeVote[];
  messages: RoomMessage[];
  session: LocalSession;
  isHost: boolean;
  myVotes: Vote[];
  myPick: TiebreakerPick | undefined;
  currentMatch: ChallengeMatch | undefined;
  myMatchVote: (matchId: string) => ChallengeVote | undefined;
}

export const RoomContext = createContext<RoomContextValue | null>(null);

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used within RoomProvider');
  return ctx;
}
