import { useQuery } from "@tanstack/react-query";

export function useEthPrice() {
  return useQuery({
    queryKey: ["ethPrice"],
    queryFn: async () => {
      const response = await fetch("/api/eth-price");
      if (!response.ok) throw new Error("Failed to fetch ETH price");
      return response.json();
    },
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 10,
  });
}
