import { createClient, createServiceClient } from '@/lib/supabase-server';

export const maxDuration = 30;

export async function POST(request) {
  try {
    // Verify identity with user client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { _photoBase64, ...profile } = body;
    if (profile.id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Use service role for storage + DB writes — bypasses RLS, safe server-side
    const admin = createServiceClient();

    // Upload photo server-side if provided
    if (_photoBase64) {
      const base64 = _photoBase64.split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      const photoPath = `${user.id}.jpg`;
      const { error: uploadError } = await admin.storage.from('photos').upload(photoPath, buffer, {
        upsert: true,
        contentType: 'image/jpeg',
      });
      if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 });
      const { data: { publicUrl } } = admin.storage.from('photos').getPublicUrl(photoPath);
      profile.photoURL = publicUrl;
    }

    const { error } = await admin.from('users').upsert(profile);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ok: true, photoURL: profile.photoURL });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
