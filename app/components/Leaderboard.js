"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { generateAvatar } from "@/lib/utils";
import { Trophy, Medal, MedalMilitary } from "@phosphor-icons/react";

function LeaderboardTable({ data }) {
  const [imageErrors, setImageErrors] = useState({});

  const getAvatarSrc = (player) => {
    if (imageErrors[player.walletAddress]) {
      return generateAvatar(player.walletAddress);
    }
    return player.profileImage || generateAvatar(player.walletAddress);
  };

  const getRankDisplay = (index) => {
    switch(index) {
      case 0:
        return (
          <div className="flex items-center justify-center">
            <Trophy weight="duotone" className="w-8 h-8 text-[#FFD700]" />
          </div>
        );
      case 1:
        return (
          <div className="flex items-center justify-center">
            <Medal weight="duotone" className="w-7 h-7 text-white/90" />
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center">
            <MedalMilitary weight="duotone" className="w-6 h-6 text-white/90" />
          </div>
        );
      default:
        return (
          <span className="text-base text-white/70">
            {index + 1}
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto" suppressHydrationWarning>
      <table className="w-full rounded-lg shadow-lg bg-black/55">
        <thead className="border-b border-white/20">
          <tr>
            <th className="p-2 text-sm font-medium tracking-wider text-center uppercase text-white/70">
              #
            </th>
            <th className="p-2 text-sm font-medium tracking-wider text-left uppercase text-white/70">
              Player
            </th>
            <th className="p-2 text-sm font-medium tracking-wider text-right uppercase text-white/70">
              Gold
            </th>
            <th className="p-2 text-sm font-medium tracking-wider text-right uppercase text-white/70">
              Wave
            </th>
            <th className="p-2 text-sm font-medium tracking-wider text-right uppercase text-white/70">
              Time
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {data.slice(0, 8).map((player, index) => (
            <tr
              key={player.walletAddress}
              className="transition-colors hover:bg-white/5"
              suppressHydrationWarning
            >
              <td className="p-2 whitespace-nowrap text-center">
                {getRankDisplay(index)}
              </td>
              <td className="p-2 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8">
                    <Image
                      className="w-8 h-8 rounded-full bg-gray-800"
                      src={getAvatarSrc(player)}
                      alt={player.userName || "Player avatar"}
                      width={32}
                      height={32}
                      onError={() => {
                        setImageErrors((prev) => ({
                          ...prev,
                          [player.walletAddress]: true,
                        }));
                      }}
                    />
                  </div>
                  <div className="ml-2">
                    <div className="text-base font-medium text-white">
                      {player.userName}
                    </div>
                    <div className="text-sm text-white/60">{`${player.walletAddress.slice(
                      0,
                      4
                    )}...${player.walletAddress.slice(-3)}`}</div>
                  </div>
                </div>
              </td>
              <td className="p-2 text-right whitespace-nowrap">
                <span className="text-base text-white/90">
                  {player.gold.toLocaleString()}
                </span>
              </td>
              <td className="p-2 text-right whitespace-nowrap">
                <span className="text-base text-white/90">
                  {player.waveNumber}
                </span>
              </td>
              <td className="p-2 text-right whitespace-nowrap">
                <span className="text-base text-white/90">
                  {typeof player.timeAlive === 'number' 
                    ? `${Math.floor(player.timeAlive / 60)}:${(player.timeAlive % 60).toString().padStart(2, '0')}`
                    : player.timeAlive}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div
      className="flex justify-center items-center h-32"
      suppressHydrationWarning
    >
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
  const { data, isLoading, isError } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <div className="text-xs text-red-500">Error loading leaderboard</div>
    );

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="" suppressHydrationWarning>
        <h2 className="mb-2 text-sm font-bold text-white">Leaderboard</h2>
        <LeaderboardTable data={data} />
      </div>
    </Suspense>
  );
}
