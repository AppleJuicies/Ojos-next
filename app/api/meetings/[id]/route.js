import { createClient } from '@/lib/supabase-server';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const update = { status: body.status };
    if (body.zoom_join_url) update.zoom_join_url = body.zoom_join_url;

    const { error } = await supabase.from('meetings').update(update).eq('id', id);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
