import { createClient } from '@/lib/supabase-server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ meeting: null }, { status: 401 });

    const { data: m, error } = await supabase.from('meetings').select('*').eq('id', id).maybeSingle();
    if (error || !m) return Response.json({ meeting: null });

    const role    = m.host_id === user.id ? 'host' : 'requester';
    const otherId = role === 'host' ? m.requester_id : m.host_id;
    const { data: profile } = await supabase.from('users').select('*').eq('id', otherId).maybeSingle();

    return Response.json({ meeting: { ...m, role }, profile: profile ?? null });
  } catch (err) {
    return Response.json({ meeting: null, profile: null }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase.from('meetings').update(body).eq('id', id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
