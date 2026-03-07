'use client';

import { getSupabaseClient } from '@/lib/supabase';
import { ChallengeMatch, ChallengeVote, LocalSession, Participant, Room, RoomMessage, Suggestion, TiebreakerPick, Vote } from '@/types';
import { useEffect, useReducer } from 'react';
import { RoomContext } from './RoomContext';

interface State {
  room: Room;
  participants: Participant[];
  suggestions: Suggestion[];
  votes: Vote[];
  tiebreakerPicks: TiebreakerPick[];
  challengeMatches: ChallengeMatch[];
  challengeVotes: ChallengeVote[];
  messages: RoomMessage[];
}

type Action =
  | { type: 'SET_ROOM'; room: Room }
  | { type: 'UPSERT_PARTICIPANT'; participant: Participant }
  | { type: 'REMOVE_PARTICIPANT'; id: string }
  | { type: 'ADD_SUGGESTION'; suggestion: Suggestion }
  | { type: 'REMOVE_SUGGESTION'; id: string }
  | { type: 'UPSERT_VOTE'; vote: Vote }
  | { type: 'UPSERT_TIEBREAKER'; pick: TiebreakerPick }
  | { type: 'UPSERT_CHALLENGE_MATCH'; match: ChallengeMatch }
  | { type: 'ADD_CHALLENGE_VOTE'; vote: ChallengeVote }
  | { type: 'ADD_MESSAGE'; message: RoomMessage };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ROOM':
      return { ...state, room: action.room };
    case 'UPSERT_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.some((p) => p.id === action.participant.id)
          ? state.participants.map((p) => (p.id === action.participant.id ? action.participant : p))
          : [...state.participants, action.participant],
      };
    case 'REMOVE_PARTICIPANT':
      return { ...state, participants: state.participants.filter((p) => p.id !== action.id) };
    case 'ADD_SUGGESTION':
      return {
        ...state,
        suggestions: state.suggestions.some((s) => s.id === action.suggestion.id)
          ? state.suggestions
          : [...state.suggestions, action.suggestion],
      };
    case 'REMOVE_SUGGESTION':
      return { ...state, suggestions: state.suggestions.filter((s) => s.id !== action.id) };
    case 'UPSERT_VOTE':
      return {
        ...state,
        votes: state.votes.some((v) => v.id === action.vote.id)
          ? state.votes.map((v) => (v.id === action.vote.id ? action.vote : v))
          : [...state.votes, action.vote],
      };
    case 'UPSERT_TIEBREAKER':
      return {
        ...state,
        tiebreakerPicks: state.tiebreakerPicks.some((t) => t.id === action.pick.id)
          ? state.tiebreakerPicks.map((t) => (t.id === action.pick.id ? action.pick : t))
          : [...state.tiebreakerPicks, action.pick],
      };
    case 'UPSERT_CHALLENGE_MATCH':
      return {
        ...state,
        challengeMatches: state.challengeMatches.some((m) => m.id === action.match.id)
          ? state.challengeMatches.map((m) => (m.id === action.match.id ? action.match : m))
          : [...state.challengeMatches, action.match],
      };
    case 'ADD_CHALLENGE_VOTE':
      return {
        ...state,
        challengeVotes: state.challengeVotes.some((v) => v.id === action.vote.id)
          ? state.challengeVotes
          : [...state.challengeVotes, action.vote],
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: state.messages.some((m) => m.id === action.message.id)
          ? state.messages
          : [...state.messages, action.message],
      };
    default:
      return state;
  }
}

interface Props {
  initial: State;
  session: LocalSession;
  children: React.ReactNode;
}

export function RoomProvider({ initial, session, children }: Props) {
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const roomId = initial.room.id;

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.new) dispatch({ type: 'SET_ROOM', room: payload.new as Room });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'participants',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          dispatch({ type: 'UPSERT_PARTICIPANT', participant: payload.new as Participant });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'participants',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          dispatch({ type: 'UPSERT_PARTICIPANT', participant: payload.new as Participant });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'participants',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          dispatch({ type: 'REMOVE_PARTICIPANT', id: (payload.old as Participant).id });
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'suggestions', filter: `room_id=eq.${roomId}` },
        (payload) => {
          // Suggestion may lack participant join – enrich client-side
          const s = payload.new as Suggestion;
          const participant = state.participants.find((p) => p.id === s.participant_id);
          dispatch({ type: 'ADD_SUGGESTION', suggestion: { ...s, participant } });
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'suggestions', filter: `room_id=eq.${roomId}` },
        (payload) => {
          dispatch({ type: 'REMOVE_SUGGESTION', id: (payload.old as Suggestion).id });
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
        (payload) => {
          dispatch({ type: 'UPSERT_VOTE', vote: payload.new as Vote });
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
        (payload) => {
          dispatch({ type: 'UPSERT_VOTE', vote: payload.new as Vote });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tiebreaker_picks',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          dispatch({ type: 'UPSERT_TIEBREAKER', pick: payload.new as TiebreakerPick });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tiebreaker_picks',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          dispatch({ type: 'UPSERT_TIEBREAKER', pick: payload.new as TiebreakerPick });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'challenge_matches',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          dispatch({ type: 'UPSERT_CHALLENGE_MATCH', match: payload.new as ChallengeMatch });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'challenge_matches',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          dispatch({ type: 'UPSERT_CHALLENGE_MATCH', match: payload.new as ChallengeMatch });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'challenge_votes',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          dispatch({ type: 'ADD_CHALLENGE_VOTE', vote: payload.new as ChallengeVote });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const m = payload.new as RoomMessage;
          const participant = state.participants.find((p) => p.id === m.participant_id);
          dispatch({ type: 'ADD_MESSAGE', message: { ...m, participant } });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.room.id]);

  const isHost = state.room.host_session_token === session.token;
  const myVotes = state.votes.filter((v) => v.participant_id === session.participantId);
  const myPick = state.tiebreakerPicks.find((t) => t.participant_id === session.participantId);

  const currentMatch = state.challengeMatches
    .filter((m) => m.winner_id === null)
    .sort((a, b) => a.round - b.round || a.match_index - b.match_index)[0];

  const myMatchVote = (matchId: string) =>
    state.challengeVotes.find(
      (v) => v.match_id === matchId && v.participant_id === session.participantId,
    );

  return (
    <RoomContext.Provider
      value={{
        room: state.room,
        participants: state.participants,
        suggestions: state.suggestions,
        votes: state.votes,
        tiebreakerPicks: state.tiebreakerPicks,
        challengeMatches: state.challengeMatches,
        challengeVotes: state.challengeVotes,
        messages: state.messages,
        session,
        isHost,
        myVotes,
        myPick,
        currentMatch,
        myMatchVote,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}
