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

const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.ipfs.io/ipfs/',
  'https://cf-ipfs.com/ipfs/',
];

export function NftView({ walletAddress }) {
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});

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

  function getNextGatewayUrl(currentUrl) {
    const ipfsHash = currentUrl.split('ipfs://')[1];
    if (!ipfsHash) return currentUrl; // Return original if not IPFS
    
    const currentGateway = IPFS_GATEWAYS.find(gateway => currentUrl.includes(gateway));
    const currentIndex = IPFS_GATEWAYS.indexOf(currentGateway);
    const nextIndex = (currentIndex + 1) % IPFS_GATEWAYS.length;
    
    return `${IPFS_GATEWAYS[nextIndex]}${ipfsHash}`;
  }

  function handleImageError(nftId, currentSrc) {
    setImageErrors(prev => ({
      ...prev,
      [nftId]: {
        attempts: (prev[nftId]?.attempts || 0) + 1,
        currentSrc: getNextGatewayUrl(currentSrc),
      },
    }));
  }

  if (isLoading) {
    return (
      <div className="w-full p-2">
        <Card className="h-24 overflow-hidden backdrop-blur-xs bg-black/40">
          <CardContent className="flex items-center justify-center h-full">
            <Skeleton className="w-1/3 h-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="py-4 text-center text-white">
        <p className="text-sm text-white/50">No NFTs found</p>
      </div>
    );
  }

  return (
    <div className="w-full p-2">
      <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
        {nfts.map((nft, index) => {
          const nftId = `${nft.contractAddress}-${nft.tokenId}`;
          const imageUrl = imageErrors[nftId]?.currentSrc || 
            nft.image.replace('ipfs://', IPFS_GATEWAYS[0]);

          return (
            <Card
              key={nftId}
              className="overflow-hidden text-white transition-all duration-300 border-0 backdrop-blur-xs bg-black/40 hover:bg-black/50"
            >
              <CardHeader className="p-0">
                <div className="relative w-full aspect-square">
                  <Image
                    src={imageUrl}
                    alt={nft.title}
                    fill
                    className="object-cover transition-opacity duration-300 opacity-90 hover:opacity-100"
                    sizes="(max-width: 768px) 25vw, (max-width: 1200px) 16.666vw, 12.5vw"
                    priority={index < 4}
                    onError={() => {
                      if (imageErrors[nftId]?.attempts < IPFS_GATEWAYS.length) {
                        handleImageError(nftId, imageUrl);
                      }
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-1">
                <h3 className="text-xs font-medium truncate text-white/90">{nft.title}</h3>
                <p className="text-[10px] text-white/50 line-clamp-1">
                  {nft.description}
                </p>
              </CardContent>
              <CardFooter className="p-1 pt-0">
                <p className="text-[10px] text-white/50">{nft.tokenType}</p>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
