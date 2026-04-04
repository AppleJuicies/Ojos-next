import { createClient } from '@/lib/supabase-server';

const STATUS_COLOR = {
  pending:   '#f59e0b',
  confirmed: '#16a34a',
  completed: '#94a3b8',
  declined:  '#dc2626',
  cancelled: '#dc2626',
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ meetings: [] }, { status: 401 });

    const uid = user.id;
    const [{ data: asHost }, { data: asRequester }] = await Promise.all([
      supabase.from('meetings').select('*').eq('host_id',      uid),
      supabase.from('meetings').select('*').eq('requester_id', uid),
    ]);

    const all = [
      ...(asHost      || []).map(m => ({ ...m, role: 'host'      })),
      ...(asRequester || []).map(m => ({ ...m, role: 'requester' })),
    ].sort((a, b) => new Date(a.scheduled_at ?? 0) - new Date(b.scheduled_at ?? 0));

    const allIds = [...new Set(all.map(m => m.role === 'host' ? m.requester_id : m.host_id).filter(Boolean))];
    let profileMap = {};
    if (allIds.length) {
      const { data: profiles } = await supabase.from('users').select('id, name, "accentColor"').in('id', allIds);
      (profiles || []).forEach(p => { profileMap[p.id] = p; });
    }

    const meetings = all.map(m => {
      const otherId = m.role === 'host' ? m.requester_id : m.host_id;
      const p = profileMap[otherId] || {};
      return {
        ...m,
        host_name:      profileMap[m.host_id]?.name      || 'Unknown',
        requester_name: profileMap[m.requester_id]?.name || 'Unknown',
        accentColor:    p.accentColor || STATUS_COLOR[m.status] || '#002fa7',
      };
    });

    return Response.json({ meetings });
  } catch (err) {
    console.error('meetings API error:', err.message);
    return Response.json({ meetings: [] }, { status: 500 });
  }
}
