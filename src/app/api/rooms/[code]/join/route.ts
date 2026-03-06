import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { name } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  const { data: room, error: roomErr } = await db
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  if (room.phase !== 'lobby') {
    return NextResponse.json(
      { error: 'This room has already started. You can no longer join.' },
      { status: 400 }
    );
  }

  const sessionToken = crypto.randomUUID();

  const { data: participant, error: partErr } = await db
    .from('participants')
    .insert({ room_id: room.id, name: name.trim(), session_token: sessionToken })
    .select()
    .single();

  if (partErr || !participant) {
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }

  return NextResponse.json({ room, participant, sessionToken });
}
