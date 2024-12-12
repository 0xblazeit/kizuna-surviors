"use client";

import { Suspense } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

function LeaderboardTable({ data }) {
  return (
    <div className="overflow-x-auto" suppressHydrationWarning>
      <table className="w-full bg-transparent rounded-lg shadow-lg backdrop-blur-sm">
        <thead className="border-b border-gray-200/20 dark:border-gray-700/20">
          <tr>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
              Rank
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
              Player
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
              Gold
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
              Kills
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
              Wave
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
              Time Alive
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200/10 dark:divide-gray-700/10">
          {data.map((player, index) => (
            <tr
              key={player.walletAddress}
              className="transition-colors hover:bg-white/5 dark:hover:bg-gray-800/10"
              suppressHydrationWarning
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div
                  className={`
                    inline-flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-sm
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
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10">
                    <Image
                      className="w-10 h-10 rounded-full"
                      src={player.profileImage}
                      alt={player.userName}
                      width={40}
                      height={40}
                    />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {player.userName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{`${player.walletAddress.slice(
                      0,
                      6
                    )}...${player.walletAddress.slice(-4)}`}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {player.gold.toLocaleString()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {player.kills.toLocaleString()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {player.waveNumber}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {player.timeAlive}
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
      className="flex justify-center items-center h-64"
      suppressHydrationWarning
    >
      <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-gray-900 animate-spin dark:border-gray-100"></div>
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
    return <div className="text-red-500">Error loading leaderboard</div>;

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="p-4" suppressHydrationWarning>
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Leaderboard
        </h2>
        <LeaderboardTable data={data} />
      </div>
    </Suspense>
  );
}
