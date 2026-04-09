import { createClient, createServiceClient } from '@/lib/supabase-server';

export const maxDuration = 30;

export async function POST(request) {
  try {
    // Verify identity
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { _photoBase64, ...profile } = body;
    if (profile.id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Upload photo via Supabase Storage REST API directly (most reliable server-side)
    if (_photoBase64) {
      const base64 = _photoBase64.split(',')[1];
      if (!base64) return Response.json({ error: 'Invalid photo data' }, { status: 400 });

      const buffer = Buffer.from(base64, 'base64');
      const photoPath = `${user.id}.jpg`;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!serviceKey) return Response.json({ error: 'Server misconfigured: missing service key' }, { status: 500 });

      // Try PUT (upsert) first
      const uploadRes = await fetch(
        `${supabaseUrl}/storage/v1/object/photos/${photoPath}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'image/jpeg',
            'x-upsert': 'true',
          },
          body: buffer,
        }
      );

      if (!uploadRes.ok) {
        const errBody = await uploadRes.text();
        console.error('Storage upload failed:', uploadRes.status, errBody);
        return Response.json({ error: `Photo upload failed (${uploadRes.status}): ${errBody}` }, { status: 500 });
      }

      profile.photoURL = `${supabaseUrl}/storage/v1/object/public/photos/${photoPath}?t=${Date.now()}`;
    }

    // Save profile to DB using service role (bypasses RLS)
    const admin = createServiceClient();
    const { error } = await admin.from('users').upsert(profile);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ok: true, photoURL: profile.photoURL });
  } catch (err) {
    console.error('Profile save error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
