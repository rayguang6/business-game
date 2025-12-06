import { createClient } from '@supabase/supabase-js';
import 'server-only';

/**
 * Server-side Supabase client using service role key.
 * This bypasses RLS and should only be used in server components, server actions, and API routes.
 * Never expose this client to the client-side code.
 */
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseServer);
}





