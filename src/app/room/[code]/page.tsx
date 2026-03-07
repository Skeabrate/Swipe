import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { SessionLoader } from './SessionLoader';

interface Props {
  params: Promise<{ code: string }>;
}

export default async function RoomPage({ params }: Props) {
  const { code } = await params;
  const db = getSupabaseAdmin();

  const { data: room } = await db
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (!room) notFound();

  const [{ data: participants }, { data: suggestions }, { data: votes }, { data: tiebreakerPicks }] =
    await Promise.all([
      db.from('participants').select('*').eq('room_id', room.id).order('created_at'),
      db.from('suggestions').select('*, participant:participants(id,name)').eq('room_id', room.id).order('created_at'),
      db.from('votes').select('*').eq('room_id', room.id),
      db.from('tiebreaker_picks').select('*').eq('room_id', room.id),
    ]);

  return (
    <main className="min-h-dvh bg-[#0a0a0f] overflow-auto">
      <SessionLoader
        initialData={{
          room,
          participants: participants ?? [],
          suggestions: (suggestions as never) ?? [],
          votes: votes ?? [],
          tiebreakerPicks: tiebreakerPicks ?? [],
        }}
      />
    </main>
  );
}
