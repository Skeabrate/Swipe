import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { category_id } = await req.json();
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from('user_ideas')
    .update({ category_id: category_id ?? null })
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update idea' }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getSupabaseAdmin();

  const { error } = await db
    .from('user_ideas')
    .delete()
    .eq('id', id)
    .eq('clerk_user_id', userId);

  if (error) return NextResponse.json({ error: 'Failed to delete idea' }, { status: 500 });
  return NextResponse.json({ success: true });
}
