'use client';

import dynamic from 'next/dynamic';
import LoadingScreen from './components/LoadingScreen';

// Dynamically import the game component to avoid SSR issues
const Game = dynamic(() => import('./components/Game'), { 
  ssr: false,
  loading: () => <LoadingScreen />
});

export default function Home() {
  return <Game />;
}
