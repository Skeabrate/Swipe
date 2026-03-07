export type Phase = 'lobby' | 'submitting' | 'voting' | 'tiebreaker' | 'wheel' | 'challenge' | 'results';

export interface Room {
  id: string;
  code: string;
  topic: string;
  phase: Phase;
  host_session_token: string;
  max_suggestions: number;
  anonymous: boolean;
  ideas_mode: 'open' | 'predefined';
  draw_type: 'standard' | 'challenge';
  created_at: string;
  wheel_winner_id?: string | null;
}

export interface ChallengeMatch {
  id: string;
  room_id: string;
  round: number;
  match_index: number;
  suggestion_id_1: string;
  suggestion_id_2: string | null;
  winner_id: string | null;
  created_at: string;
}

export interface ChallengeVote {
  id: string;
  room_id: string;
  match_id: string;
  participant_id: string;
  suggestion_id: string;
  created_at: string;
}

export interface Participant {
  id: string;
  room_id: string;
  name: string;
  session_token: string;
  is_ready: boolean;
  created_at: string;
}

export interface Suggestion {
  id: string;
  room_id: string;
  participant_id: string;
  title: string;
  created_at: string;
  participant?: Participant;
}

export interface Vote {
  id: string;
  room_id: string;
  suggestion_id: string;
  participant_id: string;
  liked: boolean;
  created_at: string;
}

export interface TiebreakerPick {
  id: string;
  room_id: string;
  suggestion_id: string;
  participant_id: string;
  created_at: string;
}

export interface SuggestionScore {
  suggestion: Suggestion;
  likes: number;
}

export interface LocalSession {
  token: string;
  participantId: string;
  roomCode: string;
  name: string;
}
