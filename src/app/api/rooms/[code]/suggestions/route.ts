import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

async function getParticipant(db: ReturnType<typeof import('@/lib/supabaseAdmin').getSupabaseAdmin>, token: string | null, roomId: string) {
  if (!token) return null;
  const { data } = await db
    .from('participants')
    .select('*')
    .eq('session_token', token)
    .eq('room_id', roomId)
    .single();
  return data;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  const { title } = await req.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  const { data: room } = await db.from('rooms').select('*').eq('code', code.toUpperCase()).single();
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.phase !== 'submitting') return NextResponse.json({ error: 'Submissions are closed' }, { status: 400 });

  const participant = await getParticipant(db, token, room.id);
  if (!participant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check count
  const { count } = await db
    .from('suggestions')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', room.id)
    .eq('participant_id', participant.id);

  if ((count ?? 0) >= room.max_suggestions) {
    return NextResponse.json({ error: `Max ${room.max_suggestions} suggestions reached` }, { status: 400 });
  }

  const { data: suggestion, error } = await db
    .from('suggestions')
    .insert({ room_id: room.id, participant_id: participant.id, title: title.trim() })
    .select('*, participant:participants(id,name)')
    .single();

  if (error || !suggestion) {
    return NextResponse.json({ error: 'Failed to add suggestion' }, { status: 500 });
  }

  return NextResponse.json({ suggestion });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  const { suggestionId } = await req.json();

  const db = getSupabaseAdmin();

  const { data: room } = await db.from('rooms').select('*').eq('code', code.toUpperCase()).single();
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.phase !== 'submitting') return NextResponse.json({ error: 'Submissions are closed' }, { status: 400 });

  const participant = await getParticipant(db, token, room.id);
  if (!participant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db.from('suggestions').delete().eq('id', suggestionId).eq('participant_id', participant.id);

  return NextResponse.json({ ok: true });
}
