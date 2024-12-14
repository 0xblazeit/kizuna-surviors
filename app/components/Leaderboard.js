"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { generateAvatar } from "@/lib/utils";
import { Trophy, Medal, MedalMilitary, PawPrint } from "@phosphor-icons/react";
import { usePrivy } from "@privy-io/react-auth";

function LeaderboardTable({ data }) {
  const [imageErrors, setImageErrors] = useState({});
  const { ready, authenticated, user } = usePrivy();

  const getAvatarSrc = (player) => {
    if (imageErrors[player.walletAddress]) {
      return generateAvatar(player.walletAddress);
    }
    return player.profileImage || generateAvatar(player.walletAddress);
  };

  const isCurrentUser = (player) => {
    if (!ready || !authenticated || !user) return false;

    // Check wallet address
    const isWalletMatch = user.wallet?.address?.toLowerCase() === player.walletAddress?.toLowerCase();

    // Check username
    const isUsernameMatch = user.twitter?.username?.toLowerCase() === player.userName?.toLowerCase();

    return isWalletMatch || isUsernameMatch;
  };

  const getRankDisplay = (index) => {
    switch (index) {
      case 0:
        return (
          <div className="flex justify-center items-center">
            <Trophy weight="duotone" className="w-8 h-8 text-[#FFD700]" />
          </div>
        );
      case 1:
        return (
          <div className="flex justify-center items-center">
            <Medal weight="duotone" className="w-7 h-7 text-white/90" />
          </div>
        );
      case 2:
        return (
          <div className="flex justify-center items-center">
            <MedalMilitary weight="duotone" className="w-6 h-6 text-white/90" />
          </div>
        );
      default:
        return <span className="text-base text-white/70">{index + 1}</span>;
    }
  };

  function formatTime(timeValue) {
    // If it's a string (like "247.268"), convert to number
    const seconds = typeof timeValue === "string" ? parseFloat(timeValue) : timeValue;
    if (typeof seconds !== "number" || isNaN(seconds)) return timeValue;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    const hoursStr = hours > 0 ? `${hours}:` : "";
    const minutesStr = `${minutes.toString().padStart(2, "0")}:`;
    const secondsStr = `${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;

    return `${hoursStr}${minutesStr}${secondsStr}`;
  }

  return (
    <div className="overflow-x-auto" suppressHydrationWarning>
      <table className="w-full rounded-lg shadow-lg bg-black/55">
        <thead className="border-b border-white/20">
          <tr>
            <th className="p-2 text-sm font-medium tracking-wider text-center uppercase text-white/70">#</th>
            <th className="p-2 text-sm font-medium tracking-wider text-left uppercase text-white/70">Player</th>
            <th className="p-2 text-sm font-medium tracking-wider text-right uppercase text-white/70">Gold</th>
            <th className="p-2 text-sm font-medium tracking-wider text-right uppercase text-white/70">Kills</th>
            <th className="p-2 text-sm font-medium tracking-wider text-right uppercase text-white/70">Wave</th>
            <th className="p-2 text-sm font-medium tracking-wider text-right uppercase text-white/70">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {data.slice(0, 8).map((player, index) => {
            const isYou = isCurrentUser(player);
            return (
              <tr
                key={`${player.walletAddress}-${player.userName}-${index}`}
                className={`transition-colors ${isYou ? "bg-white/10 hover:bg-white/15" : "hover:bg-white/5"}`}
                suppressHydrationWarning
              >
                <td className="p-1 text-center whitespace-nowrap">{getRankDisplay(index)}</td>
                <td className="p-1 whitespace-nowrap">
                  <div className="flex gap-0.5 items-center">
                    <div className="flex flex-col items-center gap-0.5 min-w-full">
                      <div className="relative w-8 h-8">
                        <Image
                          src={getAvatarSrc(player)}
                          alt={`${player.walletAddress}'s avatar`}
                          className="rounded-full"
                          fill
                          sizes="32px"
                          onError={() => {
                            setImageErrors((prev) => ({
                              ...prev,
                              [player.walletAddress]: true,
                            }));
                          }}
                        />
                      </div>
                      <span className="text-[15px] font-medium md:text-lg tracking-tight text-white/80">
                        {player.username || "—"}
                      </span>
                      {isYou && (
                        <span className="flex gap-0.5 items-center px-1.5 py-0.5 text-xs font-medium rounded-full text-white/90 bg-white/10">
                          <PawPrint weight="duotone" className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-2 text-right whitespace-nowrap">
                  <span className="text-base text-white/90">{player.gold.toLocaleString()}</span>
                </td>
                <td className="p-2 text-right whitespace-nowrap">
                  <span className="text-base text-white/90">{player.kills}</span>
                </td>
                <td className="p-2 text-right whitespace-nowrap">
                  <span className="text-base text-white/90">{player.waveNumber}</span>
                </td>
                <td className="p-2 text-right whitespace-nowrap">
                  <span className="text-base text-white/90">{formatTime(player.timeAlive)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-32" suppressHydrationWarning>
      <div className="w-8 h-8 rounded-full border-t-2 border-b-2 border-gray-900 animate-spin dark:border-gray-100"></div>
    </div>
  );
}

async function fetchLeaderboard() {
  const response = await fetch("/api/leaderboard");
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to fetch leaderboard");
  }
  return response.json();
}

export default function Leaderboard() {
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <div className="flex flex-col gap-2 items-center p-4">
        <div className="text-sm text-red-500">Failed to load leaderboard</div>
        <div className="text-xs text-red-400/80">{error?.message}</div>
        <button
          onClick={() => refetch()}
          className="px-3 py-1 text-xs text-white rounded-md transition-colors bg-red-500/20 hover:bg-red-500/30"
        >
          Try Again
        </button>
      </div>
    );

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="" suppressHydrationWarning>
        <h2 className="mb-2 text-lg font-bold text-white md:text-3xl text-center">Leaderboard</h2>
        <LeaderboardTable data={response?.data || []} />
      </div>
    </Suspense>
  );
}
