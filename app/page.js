'use client';

import dynamic from 'next/dynamic';
import Loading from './components/Loading';
import Navbar from './components/Navbar';
import AnimateBackground from "./components/AnimateBackground";

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
    <main className="min-h-screen bg-transparent">
      <AnimateBackground />
      <Navbar />
      <div className="pt-16">
        {/* <Game /> */}
      </div>
    </main>
  );
}
