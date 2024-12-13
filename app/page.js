"use client";

import dynamic from "next/dynamic";
import Loading from "./components/Loading";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";

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
  const { login, authenticated } = usePrivy();

  return (
    <main className="flex justify-center items-center bg-transparent min-h-fit">
      <div className="p-8 mx-auto max-w-2xl">
        <div className="p-8 mt-8 rounded-xl shadow-lg backdrop-blur-xs bg-black/40">
          <h1 className="mb-4 text-3xl font-bold tracking-widest text-white">
            Surive the horde. Forge weapons. Climb the ranks.
          </h1>
          <p className="mb-6 text-xl tracking-tight text-slate-200">
            A 2D rouguelike survival game where players unleash chaos in a relentless bullet firestorm to fend off
            endless waves of enemies while upgrading weapons found on-chain living on{" "}
            <a
              href="https://shape.network/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              Shape L2
            </a>
          </p>
          <div className="flex justify-center mt-8">
            {!authenticated && (
              <Button
                onClick={login}
                className="relative px-8 py-3 font-mono font-bold text-white uppercase transition-all duration-200 
                          bg-gradient-to-r from-purple-600 to-blue-600 
                          border-2 border-white/20 
                          hover:from-purple-700 hover:to-blue-700
                          hover:scale-105 hover:shadow-[0_0_20px_rgba(88,28,135,0.5)]
                          after:content-[''] after:absolute after:inset-0 
                          after:border-2 after:border-white/10 after:m-[-2px]
                          after:bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,0.2)_25%,rgba(68,68,68,0.2)_50%,transparent_50%,transparent_75%,rgba(68,68,68,0.2)_75%)]
                          after:bg-[length:4px_4px]
                          after:animate-[pixelate_0.5s_infinite_linear]
                          active:scale-95
                          flex items-center gap-3"
              >
                <Image
                  src="/shapecraft-survivors-logo.svg"
                  alt="Game Logo"
                  width={24}
                  height={24}
                  className="w-6 h-6 transition-transform group-hover:rotate-180"
                />
                Enter Arena
                <Image
                  src="/shapecraft-survivors-logo.svg"
                  alt="Game Logo"
                  width={24}
                  height={24}
                  className="w-6 h-6 transition-transform group-hover:-rotate-180"
                />
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
