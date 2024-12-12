"use client";

import dynamic from "next/dynamic";
import Loading from "./components/Loading";

// Dynamically import the game component to avoid SSR issues
const Game = dynamic(
  () =>
    new Promise((resolve) => {
      // Force a minimum delay of 2.20 seconds
      setTimeout(() => {
        resolve(import("./components/Game"));
      }, 2200);
    }),
  {
    ssr: false,
    loading: () => <Loading />,
  }
);

export default function Home() {
  return (
    <main className="flex justify-center items-center bg-transparent min-h-fit">
      <div className="p-8 mx-auto max-w-2xl">
        <div className="p-8 mt-8 rounded-xl shadow-lg backdrop-blur-xs bg-black/40">
          <h1 className="mb-4 text-3xl font-bold tracking-widest text-white">Welcome to ShapeCraft Survivors</h1>
          <p className="text-xl tracking-tight text-slate-200">
            2D rouguelike survival game where players unleash chaos in a relentless bullet firestorm to fend off endless
            waves of enemies while upgrading weapons used from on-chain assets living on{" "}
            <a href="https://shape.network/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
              Shape L2
            </a>
            .
          </p>
          <p className="mt-2 text-xl tracking-tightest text-slate-200 text-semibold">
            Surive the horde. Forge weapons. Climb the ranks.
          </p>
        </div>
      </div>
    </main>
  );
}
