import { createClient } from '@supabase/supabase-js';

// Server-only client – uses service role key, bypasses RLS
// Only import this in API routes / server components

export function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}
