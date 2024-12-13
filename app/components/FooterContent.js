"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CurrencyEth, Users, GameController, Circle } from "@phosphor-icons/react";
import { TrendDown, TrendUp } from "@phosphor-icons/react";
import { useEthPrice } from "@/hooks/useEthPrice";

export default function FooterContent() {
  const { data: ethData } = useEthPrice();

  const queryMemberCount = useQuery({
    queryKey: ["memberCount"],
    queryFn: async () => await axios.get("/api/member-total"),
    refetchOnWindowFocus: true,
  });

  const queryGameTotalPlays = useQuery({
    queryKey: ["gameTotalPlays"],
    queryFn: async () => await axios.get("/api/game-total-plays"),
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  return (
    <div className="flex mx-auto justify-center gap-x-1 md:gap-x-2 text-lg">
      <div className="flex items-center">
        <CurrencyEth className="size-4 mr-1" />
        <span>${ethData?.price?.toFixed(2) ?? "--.--"}</span>
      </div>
      <span>•</span>
      <div className="flex items-center">
        <Users className="size-4 mr-1" />
        {queryMemberCount.isLoading ? (
          <Circle weight="fill" className="text-yellow-500 size-2" />
        ) : (
          queryMemberCount.data?.data.count ?? <Circle weight="fill" className="text-red-500 size-2" />
        )}
      </div>
      <span>•</span>
      <div className="flex items-center">
        <GameController className="size-4 mr-1" />
        {queryGameTotalPlays.isLoading ? (
          <Circle weight="fill" className="text-yellow-500 size-2" />
        ) : (
          queryGameTotalPlays.data?.data.count ?? <Circle weight="fill" className="text-red-500 size-2" />
        )}
      </div>
    </div>
  );
}
