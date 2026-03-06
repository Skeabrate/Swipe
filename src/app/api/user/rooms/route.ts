import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getSupabaseAdmin();

  // Find all participants for this user
  const { data: participantRows, error: partErr } = await db
    .from('participants')
    .select('room_id')
    .eq('clerk_user_id', userId);

  if (partErr) return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });

  const roomIds = (participantRows ?? []).map(p => p.room_id);
  if (roomIds.length === 0) return NextResponse.json([]);

  // Fetch rooms
  const { data: rooms, error: roomErr } = await db
    .from('rooms')
    .select('*')
    .in('id', roomIds)
    .order('created_at', { ascending: false });

  if (roomErr) return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });

  // For each room, fetch suggestions + votes to determine winner
  const roomsWithDetails = await Promise.all(
    (rooms ?? []).map(async room => {
      const { data: suggestions } = await db
        .from('suggestions')
        .select('id, title')
        .eq('room_id', room.id);

      const { data: votes } = await db
        .from('votes')
        .select('suggestion_id, liked')
        .eq('room_id', room.id);

      const suggestionList = suggestions ?? [];
      const voteList = votes ?? [];

      // Wheel mode — winner is predetermined, scores are irrelevant
      if (room.wheel_winner_id) {
        const scored = suggestionList.map(s => ({ ...s, score: 0 }));
        const winner = scored.find(s => s.id === room.wheel_winner_id) ?? null;
        return { ...room, suggestions: scored, winner };
      }

      // Score each suggestion
      const scored = suggestionList.map(s => ({
        ...s,
        score: voteList.filter(v => v.suggestion_id === s.id && v.liked).length -
               voteList.filter(v => v.suggestion_id === s.id && !v.liked).length,
      }));
      scored.sort((a, b) => b.score - a.score);

      return { ...room, suggestions: scored, winner: scored[0] ?? null };
    })
  );

  return NextResponse.json(roomsWithDetails);
}
