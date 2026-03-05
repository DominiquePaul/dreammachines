import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

function isValidEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase
      .from('waitlist')
      .upsert({ email: normalizedEmail }, { onConflict: 'email' });

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Optional Slack notification
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (slackWebhookUrl) {
      try {
        await fetch(slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `New waitlist signup: ${normalizedEmail}` })
        });
      } catch {
        // Ignore Slack errors to avoid blocking user signups
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}


