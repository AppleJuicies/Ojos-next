import { createClient } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await request.json();
    if (profile.id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { error } = await supabase.from('users').upsert(profile);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
