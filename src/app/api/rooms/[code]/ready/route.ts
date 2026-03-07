import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getSupabaseAdmin();

  const { data: room } = await db.from('rooms').select('*').eq('code', code.toUpperCase()).single();
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.phase !== 'submitting')
    return NextResponse.json({ error: 'Not in submitting phase' }, { status: 400 });

  const { data: participant } = await db
    .from('participants')
    .select('*')
    .eq('session_token', token)
    .eq('room_id', room.id)
    .single();

  if (!participant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Mark participant ready
  await db.from('participants').update({ is_ready: true }).eq('id', participant.id);

  // Check if all participants are ready
  const { data: allParticipants } = await db
    .from('participants')
    .select('is_ready')
    .eq('room_id', room.id);

  const allReady = allParticipants?.every((p: { is_ready: boolean }) => p.is_ready);

  if (allReady) {
    // Check if there are any suggestions
    const { count } = await db
      .from('suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', room.id);

    if ((count ?? 0) === 0) {
      // No suggestions – stay in submitting, mark unready
      await db.from('participants').update({ is_ready: false }).eq('room_id', room.id);
      return NextResponse.json({ advanced: false, reason: 'no_suggestions' });
    }

    await db.from('rooms').update({ phase: 'voting' }).eq('id', room.id);
    return NextResponse.json({ advanced: true, phase: 'voting' });
  }

  return NextResponse.json({ advanced: false });
}
