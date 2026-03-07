// Deterministic shuffle using room id as seed (same algorithm as Voting.tsx)
function deterministicShuffle(ids: string[], seed: string): string[] {
  const copy = [...ids];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.abs(seed.charCodeAt(i % seed.length) + i) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface MatchRow {
  round: number;
  match_index: number;
  suggestion_id_1: string;
  suggestion_id_2: string | null;
  winner_id: string | null;
}

export function generateBracketRound(
  suggestionIds: string[],
  round: number,
  roomId: string,
): MatchRow[] {
  const shuffled = deterministicShuffle(suggestionIds, roomId + round);
  const matches: MatchRow[] = [];

  const pairCount = Math.floor(shuffled.length / 2);
  for (let i = 0; i < pairCount; i++) {
    matches.push({
      round,
      match_index: i,
      suggestion_id_1: shuffled[i * 2],
      suggestion_id_2: shuffled[i * 2 + 1],
      winner_id: null,
    });
  }

  // Odd number: last idea gets a bye (auto-advances)
  if (shuffled.length % 2 === 1) {
    const byeId = shuffled[shuffled.length - 1];
    matches.push({
      round,
      match_index: pairCount,
      suggestion_id_1: byeId,
      suggestion_id_2: null,
      winner_id: byeId,
    });
  }

  return matches;
}
