"use client";

import { Suspense } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

function LeaderboardTable({ data }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-transparent rounded-lg shadow-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Rank
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Player
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Gold
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Kills
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Wave
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Time Alive
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((player, index) => (
            <tr
              key={player.walletAddress}
              className="transition-colors hover:bg-gray-50"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`
                  inline-flex items-center justify-center w-8 h-8 rounded-full 
                  ${
                    index === 0
                      ? "bg-yellow-400 text-white"
                      : index === 1
                      ? "bg-gray-300 text-gray-800"
                      : index === 2
                      ? "bg-amber-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }
                `}
                >
                  {index + 1}
                </span>
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
                    <div className="text-sm font-medium text-gray-900">
                      {player.userName}
                    </div>
                    <div className="text-sm text-gray-500">{`${player.walletAddress.slice(
                      0,
                      6
                    )}...${player.walletAddress.slice(-4)}`}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">
                  {player.gold.toLocaleString()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">
                  {player.kills.toLocaleString()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">
                  {player.waveNumber}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">
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
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="w-12 h-12 rounded-full border-b-2 border-gray-900 animate-spin"></div>
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
  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
  });

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        Failed to load leaderboard. Please try again later.
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <h2 className="mb-8 text-3xl font-bold text-center">Leaderboard</h2>
      <Suspense fallback={<LoadingSpinner />}>
        {isLoading ? <LoadingSpinner /> : <LeaderboardTable data={data} />}
      </Suspense>
    </div>
  );
}
