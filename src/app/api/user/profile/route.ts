import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getSupabaseAdmin();
  const { data } = await db
    .from('user_profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .single();

  return NextResponse.json(data ?? { clerk_user_id: userId, primary_color: '#7c3aed', username: null });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { username, primary_color } = await req.json();

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('user_profiles')
    .upsert(
      { clerk_user_id: userId, username: username ?? null, primary_color: primary_color ?? '#7c3aed', updated_at: new Date().toISOString() },
      { onConflict: 'clerk_user_id' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  return NextResponse.json(data);
}
