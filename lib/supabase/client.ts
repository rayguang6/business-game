import { createClient } from '@supabase/supabase-js';

/**
 * Client-side Supabase client for authentication only.
 * 
 * ⚠️ IMPORTANT: This client should ONLY be used for Supabase Auth (if you use it).
 * For all data fetching and mutations, use server-side functions:
 * - Server components: Use loadGameData() from '@/lib/server/loadGameData'
 * - Server actions: Use actions from '@/lib/server/actions/adminActions'
 * - Repositories: All repositories now use server-side client automatically
 * 
 * This client uses the anon key which respects RLS policies.
 * For admin operations, use the service role key via server actions.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabase);
}


