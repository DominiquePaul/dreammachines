import { createClient } from "@supabase/supabase-js";

// Create a Supabase client for API routes that respects RLS
// Uses service role key if available, otherwise uses anon key with user's access token
export function getServerSupabase(authHeader?: string | null) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  }

  // Use anon key but set the user's access token for RLS
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    authHeader
      ? { global: { headers: { Authorization: authHeader } } }
      : undefined
  );
  return client;
}
