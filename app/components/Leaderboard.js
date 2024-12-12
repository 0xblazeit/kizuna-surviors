"use client";

import { Suspense } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

function LeaderboardTable({ data }) {
  return (
    <div className="overflow-x-auto" suppressHydrationWarning>
      <table className="w-full bg-transparent rounded-lg shadow-lg">
        <thead className="bg-gray-100 dark:bg-gray-800">
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
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
          {data.map((player, index) => (
            <tr
              key={player.walletAddress}
              className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              suppressHydrationWarning
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div
                  className={`
                    inline-flex items-center justify-center w-8 h-8 rounded-full
                    ${
                      index === 0
                        ? "bg-yellow-400 text-white"
                        : index === 1
                        ? "bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                        : index === 2
                        ? "bg-amber-600 text-white"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
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
    <div className="flex justify-center items-center h-64" suppressHydrationWarning>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-gray-100"></div>
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
  if (isError) return <div className="text-red-500">Error loading leaderboard</div>;

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="p-4" suppressHydrationWarning>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Leaderboard</h2>
        <LeaderboardTable data={data} />
      </div>
    </Suspense>
  );
}
