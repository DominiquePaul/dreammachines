import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Returns a Supabase server-side client using the service role key.
 * Requires env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */
export function getSupabaseServerClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false
    },
    global: {
      headers: {
        'X-Client-Info': 'dreammachines-nextjs'
      }
    }
  });
}


