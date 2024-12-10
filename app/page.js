'use client';

import dynamic from 'next/dynamic';

// Dynamically import the game component to avoid SSR issues
const Game = dynamic(() => 
  new Promise((resolve) => {
    // Force a minimum delay of 2.20 seconds
    setTimeout(() => {
      resolve(import('./components/Game'));
    }, 2200);
  }), 
  { 
    ssr: false,
    loading: () => <Loading />
  }
);

export default function Home() {
  return (
    <main className="flex justify-center items-center bg-transparent min-h-fit">
      <div className="p-8 mx-auto max-w-2xl">
        <div className="p-8 mt-8 rounded-xl shadow-lg backdrop-blur-xs bg-black/40">
          <h1 className="mb-4 text-3xl font-bold tracking-widest text-white">Welcome to ShapeCraft Survivors</h1>
          <p className="tracking-tightest text-slate-200">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </p>
        </div>
      </div>
    </main>
  );
}
