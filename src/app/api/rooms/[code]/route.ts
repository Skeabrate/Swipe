import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const db = getSupabaseAdmin();

  const { data: room, error } = await db
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const { data: participants } = await db
    .from('participants')
    .select('*')
    .eq('room_id', room.id)
    .order('created_at');

  const { data: suggestions } = await db
    .from('suggestions')
    .select('*, participant:participants(id,name)')
    .eq('room_id', room.id)
    .order('created_at');

  const { data: votes } = await db.from('votes').select('*').eq('room_id', room.id);

  const { data: tiebreakerPicks } = await db
    .from('tiebreaker_picks')
    .select('*')
    .eq('room_id', room.id);

  return NextResponse.json({
    room,
    participants: participants ?? [],
    suggestions: suggestions ?? [],
    votes: votes ?? [],
    tiebreakerPicks: tiebreakerPicks ?? [],
  });
}
