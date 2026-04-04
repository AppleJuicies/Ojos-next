import { createClient } from '@/lib/supabase-server';

export async function GET(request, { params }) {
  try {
    const { uid } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase.from('users').select('*').eq('id', uid).maybeSingle();
    if (error) return Response.json({ profile: null }, { status: 500 });
    return Response.json({ profile: data ?? null });
  } catch (err) {
    return Response.json({ profile: null }, { status: 500 });
  }
}
