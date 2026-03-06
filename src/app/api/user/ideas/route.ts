import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('user_ideas')
    .select('*, user_categories(id, name, color)')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, category_id, source_room_code } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('user_ideas')
    .insert({
      clerk_user_id: userId,
      title: title.trim(),
      category_id: category_id ?? null,
      source_room_code: source_room_code ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to save idea' }, { status: 500 });
  return NextResponse.json(data);
}
