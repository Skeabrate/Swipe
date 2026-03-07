import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateBracketRound } from '@/lib/challenge';

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  const { matchId, suggestionId } = await req.json();

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!matchId || !suggestionId)
    return NextResponse.json({ error: 'matchId and suggestionId required' }, { status: 400 });

  const db = getSupabaseAdmin();

  const { data: room } = await db.from('rooms').select('*').eq('code', code.toUpperCase()).single();
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.phase !== 'challenge')
    return NextResponse.json({ error: 'Room is not in challenge phase' }, { status: 400 });

  const { data: participant } = await db
    .from('participants')
    .select('*')
    .eq('session_token', token)
    .eq('room_id', room.id)
    .single();
  if (!participant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: match } = await db
    .from('challenge_matches')
    .select('*')
    .eq('id', matchId)
    .eq('room_id', room.id)
    .single();
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  if (match.winner_id)
    return NextResponse.json({ error: 'Match already resolved' }, { status: 400 });
  if (suggestionId !== match.suggestion_id_1 && suggestionId !== match.suggestion_id_2)
    return NextResponse.json({ error: 'Invalid suggestion for this match' }, { status: 400 });

  // Upsert vote
  await db
    .from('challenge_votes')
    .upsert(
      { room_id: room.id, match_id: matchId, participant_id: participant.id, suggestion_id: suggestionId },
      { onConflict: 'match_id,participant_id' },
    );

  // Count votes for this match vs total participants
  const { data: allParticipants } = await db
    .from('participants')
    .select('id')
    .eq('room_id', room.id);
  const totalParticipants = allParticipants?.length ?? 0;

  const { data: matchVotes } = await db
    .from('challenge_votes')
    .select('suggestion_id')
    .eq('match_id', matchId);
  const voteCount = matchVotes?.length ?? 0;

  if (voteCount < totalParticipants) {
    return NextResponse.json({ ok: true });
  }

  // All voted — determine winner
  const tally: Record<string, number> = {};
  for (const v of matchVotes ?? []) {
    tally[v.suggestion_id] = (tally[v.suggestion_id] ?? 0) + 1;
  }
  const votes1 = tally[match.suggestion_id_1] ?? 0;
  const votes2 = tally[match.suggestion_id_2] ?? 0;

  let winnerId: string;
  if (votes1 > votes2) {
    winnerId = match.suggestion_id_1;
  } else if (votes2 > votes1) {
    winnerId = match.suggestion_id_2;
  } else {
    // Exact tie — deterministic via room id hash
    const idx = room.id.charCodeAt(0) % 2;
    winnerId = idx === 0 ? match.suggestion_id_1 : match.suggestion_id_2;
  }

  await db.from('challenge_matches').update({ winner_id: winnerId }).eq('id', matchId);

  // Check if entire current round is resolved
  const { data: roundMatches } = await db
    .from('challenge_matches')
    .select('*')
    .eq('room_id', room.id)
    .eq('round', match.round);

  const allResolved = roundMatches?.every((m: { winner_id: string | null }) => m.winner_id !== null);
  if (!allResolved) {
    return NextResponse.json({ ok: true });
  }

  // Collect winners from this round
  const winnerIds = roundMatches!.map((m: { winner_id: string }) => m.winner_id);

  if (winnerIds.length === 1) {
    // Final winner — advance to results
    await db
      .from('rooms')
      .update({ phase: 'results', wheel_winner_id: winnerIds[0] })
      .eq('id', room.id);
  } else {
    // Generate next round
    const nextMatches = generateBracketRound(winnerIds, match.round + 1, room.id);
    await db
      .from('challenge_matches')
      .insert(nextMatches.map((m) => ({ ...m, room_id: room.id })));
  }

  return NextResponse.json({ ok: true });
}
