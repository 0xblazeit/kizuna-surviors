"use client";

import { Suspense } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

function LeaderboardTable({ data }) {
  return (
    <div className="overflow-x-auto" suppressHydrationWarning>
      <table className="w-full rounded-lg shadow-lg bg-black/55">
        <thead className="border-b border-white/20">
          <tr>
            <th className="p-2 text-[10px] font-medium tracking-wider text-left uppercase text-white/70">
              #
            </th>
            <th className="p-2 text-[10px] font-medium tracking-wider text-left uppercase text-white/70">
              Player
            </th>
            <th className="p-2 text-[10px] font-medium tracking-wider text-right uppercase text-white/70">
              Gold
            </th>
            <th className="p-2 text-[10px] font-medium tracking-wider text-right uppercase text-white/70">
              Wave
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
              <td className="p-2 whitespace-nowrap">
                <div
                  className={`
                    inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-medium backdrop-blur-sm
                    ${
                      index === 0
                        ? "bg-yellow-400/90 text-white"
                        : index === 1
                        ? "bg-gray-300/80 text-gray-800 dark:bg-gray-600/80 dark:text-gray-200"
                        : index === 2
                        ? "bg-amber-600/90 text-white"
                        : "bg-gray-100/50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-300"
                    }
                  `}
                  suppressHydrationWarning
                >
                  {index + 1}
                </div>
              </td>
              <td className="p-2 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-6 h-6">
                    <Image
                      className="w-6 h-6 rounded-full"
                      src={player.avatarUrl || "/default-avatar.png"}
                      alt=""
                      width={24}
                      height={24}
                    />
                  </div>
                  <div className="ml-2">
                    <div className="text-xs font-medium text-white">
                      {player.userName}
                    </div>
                    <div className="text-[10px] text-white/60">{`${player.walletAddress.slice(
                      0,
                      4
                    )}...${player.walletAddress.slice(-3)}`}</div>
                  </div>
                </div>
              </td>
              <td className="p-2 text-right whitespace-nowrap">
                <span className="text-xs text-white/90">
                  {player.gold.toLocaleString()}
                </span>
              </td>
              <td className="p-2 text-right whitespace-nowrap">
                <span className="text-xs text-white/90">
                  {player.waveNumber}
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
    return <div className="text-xs text-red-500">Error loading leaderboard</div>;

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="p-2" suppressHydrationWarning>
        <h2 className="mb-2 text-sm font-bold text-white">Leaderboard</h2>
        <LeaderboardTable data={data} />
      </div>
    </Suspense>
  );
}
