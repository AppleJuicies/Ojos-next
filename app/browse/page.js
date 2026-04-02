'use client';
import dynamic from 'next/dynamic';

const BrowseClient = dynamic(() => import('./BrowseClient'), { ssr: false });

export default function BrowsePage() {
  return <BrowseClient />;
}
