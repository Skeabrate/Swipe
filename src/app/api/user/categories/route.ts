import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('user_categories')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, color } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('user_categories')
    .insert({ clerk_user_id: userId, name: name.trim(), color: color ?? '#7c3aed' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  return NextResponse.json(data);
}
