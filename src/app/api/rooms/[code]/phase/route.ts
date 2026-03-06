import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Host-only: advance phase manually
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  const { phase } = await req.json();

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getSupabaseAdmin();

  const { data: room } = await db.from('rooms').select('*').eq('code', code.toUpperCase()).single();
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.host_session_token !== token) return NextResponse.json({ error: 'Only the host can do this' }, { status: 403 });

  if (phase === 'submitting') {
    // Lobby → Submitting
    if (room.phase !== 'lobby') return NextResponse.json({ error: 'Invalid transition' }, { status: 400 });
    await db.from('rooms').update({ phase: 'submitting' }).eq('id', room.id);
  } else if (phase === 'voting') {
    // Force close submissions (host override)
    if (room.phase !== 'submitting') return NextResponse.json({ error: 'Invalid transition' }, { status: 400 });
    const { count } = await db
      .from('suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', room.id);
    if ((count ?? 0) === 0) return NextResponse.json({ error: 'Need at least one suggestion to start voting' }, { status: 400 });
    await db.from('rooms').update({ phase: 'voting' }).eq('id', room.id);
  } else {
    return NextResponse.json({ error: 'Invalid phase' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, phase });
}
