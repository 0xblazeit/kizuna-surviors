"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const IPFS_GATEWAYS = ["https://ipfs.io/ipfs/", "https://gateway.ipfs.io/ipfs/", "https://cf-ipfs.com/ipfs/"];

async function fetchNFTs(walletAddress) {
  if (!walletAddress) return [];
  const response = await fetch(`/api/wallet-nfts?wallet=${walletAddress}`);
  const data = await response.json();
  return data.nfts;
}

export function NftView({ walletAddress }) {
  const [imageErrors, setImageErrors] = useState({});

  const { data: nfts = [], isLoading } = useQuery({
    queryKey: ["nfts"],
    queryFn: () => fetchNFTs(walletAddress),
    enabled: !!walletAddress,
  });

  function getNextGatewayUrl(currentUrl) {
    const ipfsHash = currentUrl.split("ipfs://")[1];
    if (!ipfsHash) return currentUrl; // Return original if not IPFS

    const currentGateway = IPFS_GATEWAYS.find((gateway) => currentUrl.includes(gateway));
    const currentIndex = IPFS_GATEWAYS.indexOf(currentGateway);
    const nextIndex = (currentIndex + 1) % IPFS_GATEWAYS.length;

    return `${IPFS_GATEWAYS[nextIndex]}${ipfsHash}`;
  }

  function handleImageError(nftId, currentSrc) {
    setImageErrors((prev) => ({
      ...prev,
      [nftId]: {
        attempts: (prev[nftId]?.attempts || 0) + 1,
        currentSrc: getNextGatewayUrl(currentSrc),
      },
    }));
  }

  function formatTokenId(tokenId) {
    // Convert hex to decimal
    const decimal = parseInt(tokenId, 16);
    return "#" + decimal;
  }

  if (isLoading) {
    return null;
  }

  if (nfts.length === 0) {
    return (
      <div className="py-4 text-center text-white">
        <p className="text-sm text-white/50">No NFTs found</p>
      </div>
    );
  }

  return (
    <div className="p-2 w-full">
      <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
        {nfts.map((nft, index) => {
          const nftId = `${nft.contractAddress}-${nft.tokenId}`;
          const imageUrl = imageErrors[nftId]?.currentSrc || nft.image.replace("ipfs://", IPFS_GATEWAYS[0]);

          return (
            <Link
              href={`https://highlight.xyz/mint/shape:0x05aA491820662b131d285757E5DA4b74BD0F0e5F:31b18ae4b8b0b0be466ec33560d51935?tokenId=${parseInt(
                nft.tokenId,
                16
              )}`}
              key={`${nftId}`}
              className="block"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Card className="overflow-hidden text-white border-0 transition-all duration-300 backdrop-blur-xs bg-black/40 hover:bg-black/50">
                <CardHeader className="p-0">
                  <div className="relative w-full aspect-square">
                    <Image
                      src={imageUrl}
                      alt={nft.title}
                      fill
                      className="object-cover opacity-90 transition-opacity duration-300 hover:opacity-100"
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
                  <p className="text-[10px] text-white/50 line-clamp-2 break-words">{nft.description}</p>
                </CardContent>
                <CardFooter className="p-1 pt-0">
                  <p className="text-[10px] text-white/50">{formatTokenId(nft.tokenId)}</p>
                </CardFooter>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
