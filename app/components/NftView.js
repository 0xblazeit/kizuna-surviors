"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import Image from "next/image";

export function NftView({ walletAddress }) {
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNFTs() {
      try {
        const response = await fetch(
          `/api/wallet-nfts?wallet=${walletAddress}`
        );
        const data = await response.json();
        setNfts(data.nfts);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (walletAddress) {
      fetchNFTs();
    }
  }, [walletAddress]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (nfts.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground">No NFTs found for this wallet</p>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {nfts.map((nft, index) => (
          <Card
            key={`${nft.contractAddress}-${nft.tokenId}`}
            className="overflow-hidden transition-shadow duration-300 hover:shadow-lg"
          >
            <CardHeader className="p-0">
              <div className="relative w-full aspect-square">
                <Image
                  src={nft.image.replace("ipfs://", "https://ipfs.io/ipfs/")}
                  alt={nft.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index < 4}
                />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold truncate">{nft.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {nft.description}
              </p>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-1 p-4 pt-0">
              <p className="text-xs text-muted-foreground">
                Type: {nft.tokenType}
              </p>
              <p className="w-full text-xs truncate text-muted-foreground">
                Token ID: {nft.tokenId}
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="w-full p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="p-0">
              <Skeleton className="w-full aspect-square" />
            </CardHeader>
            <CardContent className="p-4">
              <Skeleton className="w-3/4 h-6 mb-2" />
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-5/6 h-4 mt-1" />
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Skeleton className="w-1/2 h-4" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
