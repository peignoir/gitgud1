'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  // Always redirect to founder journey (handles auth there)
  useEffect(() => {
    router.push('/founder-journey');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-6xl mb-4">🚀</div>
        <p className="text-gray-800 text-lg">Loading GitGud...</p>
      </div>
    </div>
  );
}