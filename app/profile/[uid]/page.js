import ProfileClient from './ProfileClient';

export default async function ProfilePage({ params }) {
  const { uid } = await params;
  return <ProfileClient uid={uid} />;
}
