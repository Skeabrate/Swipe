import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  const { suggestionId } = await req.json();

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getSupabaseAdmin();

  const { data: room } = await db.from('rooms').select('*').eq('code', code.toUpperCase()).single();
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.phase !== 'tiebreaker') return NextResponse.json({ error: 'Not in tiebreaker phase' }, { status: 400 });

  const { data: participant } = await db
    .from('participants')
    .select('*')
    .eq('session_token', token)
    .eq('room_id', room.id)
    .single();

  if (!participant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Upsert pick
  await db.from('tiebreaker_picks').upsert({
    room_id: room.id,
    suggestion_id: suggestionId,
    participant_id: participant.id,
  }, { onConflict: 'room_id,participant_id' });

  // Check if all participants have picked
  const { data: participants } = await db.from('participants').select('id').eq('room_id', room.id);
  const { count: pickCount } = await db
    .from('tiebreaker_picks')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', room.id);

  if ((pickCount ?? 0) >= (participants?.length ?? 0)) {
    await db.from('rooms').update({ phase: 'results' }).eq('id', room.id);
  }

  return NextResponse.json({ ok: true });
}
