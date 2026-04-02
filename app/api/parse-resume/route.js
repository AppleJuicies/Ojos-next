import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const RATE_LIMIT = 5;
const WINDOW_MS  = 60 * 60 * 1000; // 1 hour

export async function POST(request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Must be signed in.' }, { status: 401 });
  }

  // Rate limiting
  const now = Date.now();
  const { data: rateData } = await supabase
    .from('rate_limits')
    .select('count, window_start')
    .eq('id', user.id)
    .maybeSingle();

  if (rateData) {
    if (now - rateData.window_start < WINDOW_MS) {
      if (rateData.count >= RATE_LIMIT) {
        return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
      }
      await supabase.from('rate_limits').update({ count: rateData.count + 1 }).eq('id', user.id);
    } else {
      await supabase.from('rate_limits').update({ count: 1, window_start: now }).eq('id', user.id);
    }
  } else {
    await supabase.from('rate_limits').insert({ id: user.id, count: 1, window_start: now });
  }

  const { text } = await request.json();
  if (!text || typeof text !== 'string' || text.length < 50) {
    return NextResponse.json({ error: 'Resume text too short or missing.' }, { status: 400 });
  }

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Extract profile information from this resume and return ONLY a valid JSON object with these fields:
- name (string): full name
- headline (string): current job title or most recent title, max 80 chars
- company (string): current or most recent company
- location (string): city and country/state
- bio (string): a 2-3 sentence professional summary written in first person, based on their experience
- experiences (array): list of work experiences, each with:
  - title (string): job title
  - company (string): company name
  - type (string): one of "Full-time", "Internship", "Part-time", "Contract", or "Freelance"
  - startDate (string): e.g. "Jan 2024"
  - endDate (string): e.g. "Jun 2024" or "Present"
  - location (string): city and state/country
  - description (string): a concise set of 3-5 bullet points (each starting with "• ") summarizing key responsibilities and achievements, written in past tense with strong action verbs

Resume text:
${text.slice(0, 8000)}

Return only the JSON object, no markdown, no explanation.`,
    }],
  });

  let raw = message.content[0].text.trim();
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json({ success: true, data: parsed });
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response.' }, { status: 500 });
  }
}
