import { createClient } from '@/lib/supabase-server';
import BrowseClient from './BrowseClient';

export const revalidate = 120;
export const metadata = { title: 'Find — OJOs' };

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
  } catch (e) {
    console.error('Browse SSR fetch failed:', e.message);
  }
  return <BrowseClient initialUsers={users} />;
}
