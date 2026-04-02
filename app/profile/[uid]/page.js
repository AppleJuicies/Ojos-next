import ProfileClient from './ProfileClient';

export default function ProfilePage({ params }) {
  return <ProfileClient uid={params.uid} />;
}
