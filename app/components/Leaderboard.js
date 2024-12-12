"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { generateAvatar } from "@/lib/utils";
import { Trophy, Medal, MedalMilitary, User } from "@phosphor-icons/react";
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
                <td className="p-2 text-center whitespace-nowrap">{getRankDisplay(index)}</td>
                <td className="p-2 whitespace-nowrap">
                  <div className="flex gap-3 items-center">
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
                    <div className="flex gap-2 items-center">
                      <span className="text-base font-medium text-white">{player.userName}</span>
                      {isYou && (
                        <span className="flex gap-1 items-center px-1.5 py-0.5 text-xs font-medium rounded-full text-white/90 bg-white/10">
                          <User weight="duotone" className="w-3 h-3" />
                          You
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
                  <span className="text-base text-white/90">
                    {typeof player.timeAlive === "number"
                      ? `${Math.floor(player.timeAlive / 60)}:${(player.timeAlive % 60).toString().padStart(2, "0")}`
                      : player.timeAlive}
                  </span>
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
  const response = await fetch("/api/leaderboard", {
    next: { revalidate: 60 }, // Revalidate every minute
  });
  if (!response.ok) throw new Error("Failed to fetch leaderboard");
  return response.json();
}

export default function Leaderboard() {
  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <div className="text-xs text-red-500">Error loading leaderboard</div>;

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="" suppressHydrationWarning>
        <h2 className="mb-2 text-sm font-bold text-white">Leaderboard</h2>
        <LeaderboardTable data={response.data} />
      </div>
    </Suspense>
  );
}
