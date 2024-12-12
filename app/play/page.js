"use client";
import dynamic from "next/dynamic";

// Dynamically import the game component to avoid SSR issues
const Game = dynamic(() => import("../components/Game"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center w-screen h-screen bg-gray-900">
      <div className="w-[800px] h-[600px] bg-transparent border border-white flex items-center justify-center">
        <p className="text-2xl text-white">loading...</p>
      </div>
    </div>
  ),
});

export default function PlayPage() {
  return (
    <main className="min-h-screen">
      <Game />
    </main>
  );
}
