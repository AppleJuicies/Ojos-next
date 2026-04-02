import { createClient } from '@/lib/supabase-server';
import BrowseClient from './BrowseClient';

export const metadata = { title: 'Browse — OJOs' };

// SSR: fetch first page of users on the server — zero loading spinner
export default async function BrowsePage() {
  let users = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('users')
      .select('id, name, headline, "cardHeadline", "cardBio", bio, "accentColor", "nameFont", "photoURL", "photoScale", "photoOffsetX", "photoOffsetY", experiences, company')
      .order('name')
      .limit(50);
    users = data || [];
  } catch {}

  return <BrowseClient initialUsers={users} />;
}
