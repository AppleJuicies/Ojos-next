'use client';
import dynamic from 'next/dynamic';

const EditProfileClient = dynamic(() => import('./EditProfileClient'), { ssr: false });

export default function EditProfilePage() {
  return <EditProfileClient />;
}
