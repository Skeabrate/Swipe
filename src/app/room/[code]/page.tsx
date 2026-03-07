import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { SessionLoader } from './SessionLoader';

interface Props {
  params: Promise<{ code: string }>;
}

export default async function RoomPage({ params }: Props) {
  const { code } = await params;
  const db = getSupabaseAdmin();

  const { data: room } = await db.from('rooms').select('*').eq('code', code.toUpperCase()).single();

  if (!room) notFound();

  const [
    { data: participants },
    { data: suggestions },
    { data: votes },
    { data: tiebreakerPicks },
    { data: challengeMatches },
    { data: challengeVotes },
    { data: messages },
  ] = await Promise.all([
    db.from('participants').select('*').eq('room_id', room.id).order('created_at'),
    db
      .from('suggestions')
      .select('*, participant:participants(id,name)')
      .eq('room_id', room.id)
      .order('created_at'),
    db.from('votes').select('*').eq('room_id', room.id),
    db.from('tiebreaker_picks').select('*').eq('room_id', room.id),
    db.from('challenge_matches').select('*').eq('room_id', room.id).order('round').order('match_index'),
    db.from('challenge_votes').select('*').eq('room_id', room.id),
    db.from('room_messages').select('*, participant:participants(id,name,session_token,room_id,is_ready,created_at)').eq('room_id', room.id).order('created_at'),
  ]);

  return (
    <main className="h-dvh overflow-auto bg-[#0a0a0f]">
      <SessionLoader
        initialData={{
          room,
          participants: participants ?? [],
          suggestions: (suggestions as never) ?? [],
          votes: votes ?? [],
          tiebreakerPicks: tiebreakerPicks ?? [],
          challengeMatches: challengeMatches ?? [],
          challengeVotes: challengeVotes ?? [],
          messages: (messages as never) ?? [],
        }}
      />
    </main>
  );
}
