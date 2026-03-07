import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  const { suggestionId, liked } = await req.json();

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getSupabaseAdmin();

  const { data: room } = await db.from('rooms').select('*').eq('code', code.toUpperCase()).single();
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.phase !== 'voting')
    return NextResponse.json({ error: 'Not in voting phase' }, { status: 400 });

  const { data: participant } = await db
    .from('participants')
    .select('*')
    .eq('session_token', token)
    .eq('room_id', room.id)
    .single();

  if (!participant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Upsert vote
  await db.from('votes').upsert(
    {
      room_id: room.id,
      suggestion_id: suggestionId,
      participant_id: participant.id,
      liked,
    },
    { onConflict: 'suggestion_id,participant_id' },
  );

  // Check if all participants have voted on all suggestions
  const { data: participants } = await db.from('participants').select('id').eq('room_id', room.id);
  const { data: suggestions } = await db.from('suggestions').select('id').eq('room_id', room.id);
  const { count: voteCount } = await db
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', room.id);

  const totalExpected = (participants?.length ?? 0) * (suggestions?.length ?? 0);

  if ((voteCount ?? 0) >= totalExpected && totalExpected > 0) {
    // Compute scores to decide next phase
    const { data: allVotes } = await db
      .from('votes')
      .select('suggestion_id, liked')
      .eq('room_id', room.id);

    const scoreMap: Record<string, number> = {};
    for (const s of suggestions ?? []) scoreMap[s.id] = 0;
    for (const v of allVotes ?? []) {
      if (v.liked) scoreMap[v.suggestion_id] = (scoreMap[v.suggestion_id] ?? 0) + 1;
    }

    const maxScore = Math.max(...Object.values(scoreMap));
    const topIds = Object.entries(scoreMap)
      .filter(([, s]) => s === maxScore)
      .map(([id]) => id);

    if (topIds.length === 1 || maxScore === 0) {
      // Clear winner or no one liked anything
      await db.from('rooms').update({ phase: 'results' }).eq('id', room.id);
    } else {
      // Tie → tiebreaker
      await db.from('rooms').update({ phase: 'tiebreaker' }).eq('id', room.id);
    }
  }

  return NextResponse.json({ ok: true });
}
