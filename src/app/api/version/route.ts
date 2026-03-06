import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const db = getSupabaseAdmin();
  const { data } = await db.from('app_version').select('released_at').eq('id', 1).single();
  return Response.json({ releasedAt: data?.released_at ?? null });
}
