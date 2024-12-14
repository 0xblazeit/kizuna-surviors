"use client";

import { usePrivy } from "@privy-io/react-auth";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check, Info } from "@phosphor-icons/react";
import { NftView } from "./NftView";
import dynamic from "next/dynamic";
import Leaderboard from "./Leaderboard";
import { AccessDenied } from "./AccessDenied";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

async function fetchWalletBalance(walletAddress) {
  if (!walletAddress) return null;
  const response = await fetch(`/api/eth-balance?wallet=${walletAddress}`);
  if (!response.ok) {
    console.log("Network response was not ok");
  }
  const data = await response.json();
  return data.balance;
}

async function verifyAccess(walletAddress) {
  if (!walletAddress) return null;
  const response = await fetch(`/api/verify-access?wallet=${walletAddress}`);
  if (!response.ok) {
    throw new Error("Failed to verify access");
  }
  return response.json();
}

// Dynamically import the game component to avoid SSR issues
const Game = dynamic(() => import("./Game"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center w-screen h-screen bg-gray-900">
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
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useQuery({
    queryKey: ["walletBalance", user?.wallet?.address],
    queryFn: () => fetchWalletBalance(user?.wallet?.address),
    enabled: !!user?.wallet?.address,
    refetchInterval: 60000 * 20,
    refetchOnWindowFocus: true,
  });

  const {
    data: accessData,
    isLoading: isAccessLoading,
    isError: isAccessError,
  } = useQuery({
    queryKey: ["accessVerification", user?.wallet?.address],
    queryFn: () => verifyAccess(user?.wallet?.address),
    enabled: !!user?.wallet?.address,
  });

  const hasAccess = accessData?.isShapeCraftKeyHolder || accessData?.isAwakenEyeHolder;

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="p-3 bg-transparent rounded-lg w-full max-w-[800px] mx-auto">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex flex-col p-4 w-full text-white rounded-xl backdrop-blur-xs bg-black/55 aspect-square">
          {!ready ? (
            <p>Loading...</p>
          ) : !authenticated ? (
            <p>Please connect your wallet</p>
          ) : (
            <>
              <h3 className="mb-2 text-lg md:text-3xl">Welcome, {user?.twitter?.username}</h3>
              <div className="space-y-1 text-sm md:text-2xl">
                <p className="flex gap-1 items-center text-white/50">
                  Wallet:{" "}
                  {user?.wallet?.address ? (
                    <span className="flex gap-2 items-center text-white">
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
                          <Check className="text-green-400" size={16} weight="bold" />
                        ) : (
                          <Copy size={16} weight="bold" />
                        )}
                      </button>
                      <TooltipProvider>
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger>
                            <Info size={16} weight="bold" className="text-white/70 hover:text-white" />
                          </TooltipTrigger>
                          <TooltipContent
                            className="max-w-xs text-xl rounded-xl border-white backdrop-blur-md"
                            sideOffset={5}
                            side="bottom"
                          >
                            <p className="">* Your embedded wallet is created and protected by Privy. </p>
                            <p className="">
                              * Export your embedded wallet to use in any external wallet (metamask, rabby, etc) through
                              profile icon.
                            </p>
                            <p className="">
                              * See more about{" "}
                              <a
                                className="underline"
                                href="https://privy.io/blog/shamir-secret-sharing-deep-dive"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Privy Security
                              </a>
                              .
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                  ) : (
                    "No wallet connected"
                  )}
                </p>
                <p className="text-white/50">
                  Chain: <span className="text-white">Shape L2</span>
                </p>
                <div className="text-sm md:text-2xl">
                  <span className="text-white/50">Balance: </span>
                  {isBalanceLoading ? (
                    <span className="text-white/70">loading...</span>
                  ) : isBalanceError ? (
                    <span className="text-red-400">Error</span>
                  ) : (
                    <span className="text-white">
                      {balance}
                      <small className="ml-1 text-white/50">ETH</small>
                    </span>
                  )}
                </div>
                <NftView walletAddress={user?.wallet?.address} />
              </div>
            </>
          )}
        </div>
        <div className="flex overflow-auto flex-col p-4 w-full h-full text-white rounded-xl backdrop-blur-xs bg-black/55 aspect-square">
          <Leaderboard />
        </div>
      </div>
      <div className="flex flex-col gap-4 items-center w-full">
        <div className="flex justify-center w-full">
          {ready && authenticated ? (
            isAccessLoading ? (
              <div className="flex justify-center items-center w-screen h-screen bg-gray-900">
                <div className="w-[800px] h-[600px] bg-black border border-white flex items-center justify-center">
                  <p className="text-2xl text-white">loading...</p>
                </div>
              </div>
            ) : isAccessError ? (
              <div className="text-red-500">Failed to verify access. Please try again.</div>
            ) : hasAccess ? (
              <>
                <Game />
              </>
            ) : (
              <AccessDenied />
            )
          ) : (
            <AccessDenied />
          )}
        </div>
      </div>
    </div>
  );
}

export default Arena;
