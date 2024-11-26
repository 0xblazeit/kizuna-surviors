'use client';

import dynamic from 'next/dynamic';

// Dynamically import the game component to avoid SSR issues
const Game = dynamic(() => import('./components/Game'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-screen h-screen bg-gray-900">
      <div className="w-[800px] h-[600px] bg-black border border-white flex items-center justify-center">
        <p className="text-white text-2xl">Loading Game...</p>
      </div>
    </div>
  )
});

export default function Home() {
  return <Game />;
}
