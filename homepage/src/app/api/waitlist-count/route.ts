import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching waitlist count:', error);
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Error in waitlist-count route:', error);
    return NextResponse.json({ count: 0 });
  }
}
