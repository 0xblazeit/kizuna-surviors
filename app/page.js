'use client';

import dynamic from 'next/dynamic';
import Loading from './components/Loading';

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
  return <Game />;
}
