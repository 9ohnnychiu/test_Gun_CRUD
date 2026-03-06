'use client';

import dynamic from 'next/dynamic';

// Dynamically import the GunDemo component with SSR disabled
// This is necessary because Gun.js relies on browser APIs like window and localStorage
const GunDemo = dynamic(() => import('@/components/GunDemo'), {
  ssr: false,
});

export default function Page() {
  return <GunDemo />;
}
