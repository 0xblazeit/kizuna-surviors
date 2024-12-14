import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type === 'nfts') {
    return NextResponse.json({
      totalCount: 10,
      nfts: [
        {
          contractAddress: "0x05aa491820662b131d285757e5da4b74bd0f0e5f",
          tokenId: "0x0000000000000000000000000000000000000000000000000000000000000252",
          title: "Kizuna Warrior",
          description: "Legendary warrior of the digital realm",
          tokenType: "ERC721",
          image: "ipfs://QmcmEDyaw4RXADwuJ5SZWjYDwJiqdhwiYCCB1Y6FQGn1fp"
        },
        {
          contractAddress: "0x05aa491820662b131d285757e5da4b74bd0f0e5f",
          tokenId: "0x0000000000000000000000000000000000000000000000000000000000000253",
          title: "Cyber Samurai",
          description: "Master of digital combat arts",
          tokenType: "ERC721",
          image: "ipfs://QmcmEDyaw4RXADwuJ5SZWjYDwJiqdhwiYCCB1Y6FQGn1fg"
        },
        {
          contractAddress: "0x05aa491820662b131d285757e5da4b74bd0f0e5f",
          tokenId: "0x0000000000000000000000000000000000000000000000000000000000000254",
          title: "Digital Ninja",
          description: "Silent guardian of the blockchain",
          tokenType: "ERC721",
          image: "ipfs://QmcmEDyaw4RXADwuJ5SZWjYDwJiqdhwiYCCB1Y6FQGn1fh"
        },
        {
          contractAddress: "0x05aa491820662b131d285757e5da4b74bd0f0e5f",
          tokenId: "0x0000000000000000000000000000000000000000000000000000000000000255",
          title: "Quantum Knight",
          description: "Defender of digital dimensions",
          tokenType: "ERC721",
          image: "ipfs://QmcmEDyaw4RXADwuJ5SZWjYDwJiqdhwiYCCB1Y6FQGn1fi"
        },
        {
          contractAddress: "0x05aa491820662b131d285757e5da4b74bd0f0e5f",
          tokenId: "0x0000000000000000000000000000000000000000000000000000000000000256",
          title: "Crypto Mage",
          description: "Wielder of blockchain magic",
          tokenType: "ERC721",
          image: "ipfs://QmcmEDyaw4RXADwuJ5SZWjYDwJiqdhwiYCCB1Y6FQGn1fj"
        },
        {
          contractAddress: "0x05aa491820662b131d285757e5da4b74bd0f0e5f",
          tokenId: "0x0000000000000000000000000000000000000000000000000000000000000257",
          title: "Pixel Paladin",
          description: "Guardian of virtual realms",
          tokenType: "ERC721",
          image: "ipfs://QmcmEDyaw4RXADwuJ5SZWjYDwJiqdhwiYCCB1Y6FQGn1fk"
        },
        {
          contractAddress: "0x05aa491820662b131d285757e5da4b74bd0f0e5f",
          tokenId: "0x0000000000000000000000000000000000000000000000000000000000000258",
          title: "Chain Champion",
          description: "Hero of the distributed ledger",
          tokenType: "ERC721",
          image: "ipfs://QmcmEDyaw4RXADwuJ5SZWjYDwJiqdhwiYCCB1Y6FQGn1fl"
        },
        {
          contractAddress: "0x05aa491820662b131d285757e5da4b74bd0f0e5f",
          tokenId: "0x0000000000000000000000000000000000000000000000000000000000000259",
          title: "Meta Mercenary",
          description: "Soldier of the metaverse",
          tokenType: "ERC721",
          image: "ipfs://QmcmEDyaw4RXADwuJ5SZWjYDwJiqdhwiYCCB1Y6FQGn1fm"
        },
        {
          contractAddress: "0x05aa491820662b131d285757e5da4b74bd0f0e5f",
          tokenId: "0x000000000000000000000000000000000000000000000000000000000000025a",
          title: "Token Templar",
          description: "Protector of digital assets",
          tokenType: "ERC721",
          image: "ipfs://QmcmEDyaw4RXADwuJ5SZWjYDwJiqdhwiYCCB1Y6FQGn1fn"
        },
        {
          contractAddress: "0x05aa491820662b131d285757e5da4b74bd0f0e5f",
          tokenId: "0x000000000000000000000000000000000000000000000000000000000000025b",
          title: "Byte Berserker",
          description: "Warrior of the web3 wilderness",
          tokenType: "ERC721",
          image: "ipfs://QmcmEDyaw4RXADwuJ5SZWjYDwJiqdhwiYCCB1Y6FQGn1fo"
        }
      ],
      isShapeCraftKeyHolder: true
    });
  }

  const mockLeaderboard = [
    {
      userName: "SamuraiX",
      walletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      profileImage:
        "https://pbs.twimg.com/profile_images/1864423248479326208/Ftwekr7F_normal.jpg",
      gold: 15000,
      kills: 450,
      waveNumber: 25,
      timeAlive: "45:30",
    },
    {
      userName: "NinjaWarrior",
      walletAddress: "0x9B3a54D092Ad2F6D5B33a178A8E29bF2e820912F",
      profileImage:
        "https://pbs.twimg.com/profile_images/1864423248479326208/Ftwekr7F_normal.jpg",
      gold: 12500,
      kills: 380,
      waveNumber: 22,
      timeAlive: "42:15",
    },
    {
      userName: "CryptoKnight",
      walletAddress: "0x1F3389Fc75Bf55275b03347E4283f24916D2A37f",
      profileImage: "",
      gold: 11000,
      kills: 320,
      waveNumber: 20,
      timeAlive: "38:45",
    },
    {
      userName: "BlockchainMage",
      walletAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      profileImage:
        "https://pbs.twimg.com/profile_images/479326208/Ftwekr7F_normal.jpg",
      gold: 9800,
      kills: 290,
      waveNumber: 18,
      timeAlive: "35:20",
    },
    {
      userName: "0xBlazeIt",
      walletAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      profileImage:
        "https://pbs.twimg.com/profile_images/1864423248479326208/Ftwekr7F_normal.jpg",
      gold: 8500,
      kills: 260,
      waveNumber: 16,
      timeAlive: "32:10",
    },
    {
      userName: "Web3Warrior",
      walletAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      profileImage:
        "https://pbs.twimg.com/profile_images/1864423248479326208/Ftwekr7F_normal.jpg",
      gold: 7200,
      kills: 230,
      waveNumber: 15,
      timeAlive: "30:45",
    },
    {
      userName: "MetaRogue",
      walletAddress: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
      profileImage:
        "https://pbs.twimg.com/profile_images/1864423248479326208/Ftwekr7F_normal.jpg",
      gold: 6800,
      kills: 210,
      waveNumber: 14,
      timeAlive: "28:30",
    },
    {
      userName: "ChainBreaker",
      walletAddress: "0x0D8775F648430679A709E98d2b0Cb6250d2887EF",
      profileImage:
        "https://pbs.twimg.com/profile_images/1864423248479326208/Ftwekr7F_normal.jpg",
      gold: 6200,
      kills: 190,
      waveNumber: 13,
      timeAlive: "26:15",
    },
    {
      userName: "DeFiPaladin",
      walletAddress: "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
      profileImage:
        "https://pbs.twimg.com/profile_images/1864423248479326208/Ftwekr7F_normal.jpg",
      gold: 5500,
      kills: 170,
      waveNumber: 12,
      timeAlive: "24:50",
    },
    {
      userName: "CryptoMonk",
      walletAddress: "0x1985365e9f78359a9B6AD760e32412f4a445E862",
      profileImage:
        "https://pbs.twimg.com/profile_images/1864423248479326208/Ftwekr7F_normal.jpg",
      gold: 5000,
      kills: 150,
      waveNumber: 11,
      timeAlive: "22:30",
    },
  ];

  return NextResponse.json(mockLeaderboard);
}
