import { LocalSession } from '@/types';

const KEY = (code: string) => `swipe_session_${code.toUpperCase()}`;

export function saveSession(session: LocalSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY(session.roomCode), JSON.stringify(session));
}

export function loadSession(roomCode: string): LocalSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY(roomCode));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalSession;
  } catch {
    return null;
  }
}

export function clearSession(roomCode: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY(roomCode));
}

export function generateToken(): string {
  return crypto.randomUUID();
}
