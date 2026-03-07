import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }
  if (content.trim().length > 200) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  const { data: room } = await db.from('rooms').select('*').eq('code', code.toUpperCase()).single();
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.phase !== 'lobby') {
    return NextResponse.json({ error: 'Chat is only available in the lobby' }, { status: 400 });
  }

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: participant } = await db
    .from('participants')
    .select('*')
    .eq('session_token', token)
    .eq('room_id', room.id)
    .single();
  if (!participant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: message, error } = await db
    .from('room_messages')
    .insert({ room_id: room.id, participant_id: participant.id, content: content.trim() })
    .select('*')
    .single();

  if (error || !message) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }

  return NextResponse.json({ message });
}
