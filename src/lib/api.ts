export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `Request failed: ${res.status}`);
  }
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json();
  }
  return undefined as T;
}

const json = (body: unknown) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  username: string | null;
  primary_color: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Idea {
  id: string;
  title: string;
  category_id: string | null;
  source_room_code: string | null;
  created_at: string;
  user_categories: Category | null;
}

export interface RoomHistorySuggestion {
  id: string;
  title: string;
  score: number;
}

export interface RoomHistory {
  id: string;
  code: string;
  topic: string;
  phase: string;
  created_at: string;
  wheel_winner_id: string | null;
  suggestions: RoomHistorySuggestion[];
  winner: RoomHistorySuggestion | null;
}

export interface CreateRoomData {
  name: string;
  topic: string;
  maxSuggestions: number;
  anonymous: boolean;
  ideasMode: 'open' | 'predefined';
  predefinedIdeas: string[];
}

export interface CreateRoomResponse {
  sessionToken: string;
  participant: { id: string };
  room: { code: string };
}

export interface JoinRoomResponse {
  sessionToken: string;
  participant: { id: string };
}

// ─── User API ─────────────────────────────────────────────────────────────────

export const fetchUserProfile = () => apiFetch<UserProfile>('/api/user/profile');

export const updateUserProfile = (data: UserProfile) =>
  apiFetch<UserProfile>('/api/user/profile', { method: 'PUT', ...json(data) });

export const fetchCategories = () => apiFetch<Category[]>('/api/user/categories');

export const createCategory = (name: string, color: string) =>
  apiFetch<Category>('/api/user/categories', { method: 'POST', ...json({ name, color }) });

export const deleteCategory = (id: string) =>
  apiFetch<void>(`/api/user/categories/${id}`, { method: 'DELETE' });

export const fetchUserIdeas = () => apiFetch<Idea[]>('/api/user/ideas');

export const createUserIdea = (title: string, categoryId: string | null, sourceRoomCode?: string) =>
  apiFetch<Idea>('/api/user/ideas', {
    method: 'POST',
    ...json({
      title,
      category_id: categoryId,
      ...(sourceRoomCode ? { source_room_code: sourceRoomCode } : {}),
    }),
  });

export const deleteUserIdea = (id: string) =>
  apiFetch<void>(`/api/user/ideas/${id}`, { method: 'DELETE' });

export const moveUserIdea = (id: string, categoryId: string) =>
  apiFetch<void>(`/api/user/ideas/${id}`, {
    method: 'PATCH',
    ...json({ category_id: categoryId }),
  });

export const fetchUserRooms = () => apiFetch<RoomHistory[]>('/api/user/rooms');

// ─── Room API ─────────────────────────────────────────────────────────────────

export const createRoom = (data: CreateRoomData) =>
  apiFetch<CreateRoomResponse>('/api/rooms', { method: 'POST', ...json(data) });

export const joinRoom = (code: string, name: string) =>
  apiFetch<JoinRoomResponse>(`/api/rooms/${code}/join`, { method: 'POST', ...json({ name }) });

export const addRoomSuggestion = (code: string, title: string, token: string) =>
  apiFetch<void>(`/api/rooms/${code}/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify({ title }),
  });

export const deleteRoomSuggestion = (code: string, suggestionId: string, token: string) =>
  apiFetch<void>(`/api/rooms/${code}/suggestions`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify({ suggestionId }),
  });

export const markReady = (code: string, token: string) =>
  apiFetch<{ reason?: string }>(`/api/rooms/${code}/ready`, {
    method: 'POST',
    headers: { ...auth(token) },
  });

export const advancePhase = (code: string, phase: string, token: string) =>
  apiFetch<void>(`/api/rooms/${code}/phase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify({ phase }),
  });

export const submitVote = (code: string, suggestionId: string, liked: boolean, token: string) =>
  apiFetch<void>(`/api/rooms/${code}/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify({ suggestionId, liked }),
  });

export const submitTiebreaker = (code: string, suggestionId: string, token: string) =>
  apiFetch<void>(`/api/rooms/${code}/tiebreaker`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify({ suggestionId }),
  });
