"use client";

import { usePrivy } from "@privy-io/react-auth";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check } from "@phosphor-icons/react";
import { NftView } from "./NftView";
import dynamic from "next/dynamic";
import Leaderboard from "./Leaderboard";

async function fetchWalletBalance(walletAddress) {
  if (!walletAddress) return null;
  const response = await fetch(`/api/eth-balance?wallet=${walletAddress}`);
  if (!response.ok) {
    console.log("Network response was not ok");
  }
  const data = await response.json();
  return data.balance;
}

// Dynamically import the game component to avoid SSR issues
const Game = dynamic(() => import("./Game"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-screen h-screen bg-gray-900">
      <div className="w-[800px] h-[600px] bg-black border border-white flex items-center justify-center">
        <p className="text-2xl text-white">loading game...</p>
      </div>
    </div>
  ),
});

export function Arena() {
  const { user, authenticated, ready } = usePrivy();
  const [hasCopied, setHasCopied] = React.useState(false);

  const {
    data: balance,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["walletBalance", user?.wallet?.address],
    queryFn: () => fetchWalletBalance(user?.wallet?.address),
    enabled: !!user?.wallet?.address,
    refetchInterval: 60000 * 20,
    refetchOnWindowFocus: true,
  });

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="p-3 bg-transparent rounded-lg w-full max-w-[800px] mx-auto">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex flex-col w-full p-4 text-white rounded-xl backdrop-blur-xs bg-black/40 aspect-square">
          {!ready ? (
            <p>Loading...</p>
          ) : !authenticated ? (
            <p>Please connect your wallet</p>
          ) : (
            <>
              <h3 className="mb-2 text-lg">
                Welcome, {user?.twitter?.username}
              </h3>
              <div className="space-y-1 text-sm md:text-lg">
                <p className="flex items-center gap-1 text-white/50">
                  Wallet:{" "}
                  {user?.wallet?.address ? (
                    <span className="flex items-center gap-2 text-white">
                      <a
                        href={`https://shapescan.xyz/address/${user?.wallet?.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer hover:underline"
                      >
                        0x{user?.wallet?.address.slice(2, 6)}...
                        {user?.wallet?.address.slice(-5)}
                      </a>
                      <button
                        onClick={() => copyToClipboard(user?.wallet?.address)}
                        className="transition-opacity hover:opacity-70"
                      >
                        {hasCopied ? (
                          <Check
                            className="text-green-400"
                            size={16}
                            weight="bold"
                          />
                        ) : (
                          <Copy size={16} weight="bold" />
                        )}
                      </button>
                    </span>
                  ) : (
                    "No wallet connected"
                  )}
                </p>
                <p className="text-white/50">
                  Chain: <span className="text-white">Shape L2</span>
                </p>
                <div className="text-sm md:text-lg">
                  <span className="text-white/50">Balance: </span>
                  {isLoading ? (
                    <span className="text-white/70">loading...</span>
                  ) : isError ? (
                    <span className="text-red-400">Error</span>
                  ) : (
                    <span className="text-white">
                      {balance}
                      <small className="ml-1 text-white/50">ETH</small>
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex items-start w-full p-4 text-white rounded-xl backdrop-blur-xs bg-black/40 aspect-square overflow-hidden">
          <Leaderboard />
        </div>
      </div>
      <NftView walletAddress={user?.wallet?.address} />
      <div className="grid grid-cols-1">
        <div className="backdrop-blur-xs bg-black/40 rounded-xl aspect-[2/1] w-full flex items-center justify-center text-white p-4 text-center">
          {/* <Game />; */}
        </div>
      </div>
    </div>
  );
}
