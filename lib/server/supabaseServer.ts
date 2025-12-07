import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

/**
 * Server-side Supabase client using service role key.
 * This bypasses RLS and should only be used in server components, server actions, and API routes.
 * Never expose this client to the client-side code.
 * 
 * Uses lazy initialization to avoid throwing at module import time when env vars are missing.
 * This allows lint/tests to run without Supabase credentials.
 */
let _supabaseClient: SupabaseClient | null = null;

function initializeSupabaseClient(): SupabaseClient | null {
  if (_supabaseClient !== null) {
    return _supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    // Return null instead of throwing - repositories handle null checks
    return null;
  }

  _supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _supabaseClient;
}

/**
 * Lazy getter for Supabase client. Returns null if env vars are missing.
 * Repositories should check for null and handle gracefully.
 * 
 * Uses a Proxy to maintain the same API while enabling lazy initialization.
 */
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = initializeSupabaseClient();
    if (!client) {
      return undefined;
    }
    // Forward property access to the actual client
    const value = (client as any)[prop];
    // If it's a function, bind it to the client
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
}) as SupabaseClient | null;

export function isSupabaseConfigured(): boolean {
  return initializeSupabaseClient() !== null;
}








