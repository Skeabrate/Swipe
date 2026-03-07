import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateRoomCode } from '@/lib/roomCode';

export async function POST(req: NextRequest) {
  const { name, topic, maxSuggestions, anonymous, ideasMode, predefinedIdeas, drawType } = await req.json();
  const { userId } = await auth();

  if (!name?.trim() || !topic?.trim()) {
    return NextResponse.json({ error: 'Name and topic are required' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const sessionToken = crypto.randomUUID();

  // Generate a unique room code
  let code = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateRoomCode();
    const { data } = await db.from('rooms').select('id').eq('code', candidate).single();
    if (!data) {
      code = candidate;
      break;
    }
  }
  if (!code) return NextResponse.json({ error: 'Failed to generate room code' }, { status: 500 });

  // Create room
  const { data: room, error: roomErr } = await db
    .from('rooms')
    .insert({
      code,
      topic: topic.trim(),
      max_suggestions: maxSuggestions ?? 10,
      anonymous: anonymous ?? false,
      ideas_mode: ideasMode ?? 'open',
      draw_type: drawType ?? 'standard',
      host_session_token: sessionToken,
      ...(userId ? { clerk_user_id: userId } : {}),
    })
    .select()
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }

  // Create host participant
  const { data: participant, error: partErr } = await db
    .from('participants')
    .insert({
      room_id: room.id,
      name: name.trim(),
      session_token: sessionToken,
      ...(userId ? { clerk_user_id: userId } : {}),
    })
    .select()
    .single();

  if (partErr || !participant) {
    return NextResponse.json({ error: 'Failed to create participant' }, { status: 500 });
  }

  // Insert predefined ideas if mode is 'predefined'
  if (ideasMode === 'predefined' && Array.isArray(predefinedIdeas) && predefinedIdeas.length > 0) {
    const rows = predefinedIdeas
      .slice(0, 20)
      .map((title: string) => ({
        room_id: room.id,
        participant_id: participant.id,
        title: title.trim(),
      }))
      .filter((r) => r.title.length > 0);
    if (rows.length > 0) {
      const { error: sugErr } = await db.from('suggestions').insert(rows);
      if (sugErr)
        return NextResponse.json({ error: 'Failed to insert predefined ideas' }, { status: 500 });
    }
  }

  return NextResponse.json({
    room,
    participant,
    sessionToken,
  });
}
