import { createClient } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

export async function generateMetadata({ params }) {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('users').select('name, headline').eq('id', params.uid).maybeSingle();
    if (!data) return { title: 'User not found — OJOs' };
    return { title: `${data.name} — OJOs`, description: data.headline || '' };
  } catch {
    return { title: 'OJOs' };
  }
}

// SSR: profile data arrives with the HTML — no loading spinner
export default async function ProfilePage({ params }) {
  let profile = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('users').select('*').eq('id', params.uid).maybeSingle();
    profile = data;
  } catch {}

  if (!profile) redirect('/edit-profile');

  return <ProfileClient profile={profile} uid={params.uid} />;
}
