# ShapeCraft Survivors

A 2D top/down shooter survival game inspired by "Vampire Survivors" where players unleash chaos in a relentless bullet firestorm to fend off endless waves of enemies. Use NFT(s) found across various collections/worlds on [Shape L2](https://shape.network/) as in game playable assets/unlockables.

Current In Game Boost:

- [Shapecraft Key](https://highlight.xyz/mint/shape:0x05aA491820662b131d285757E5DA4b74BD0F0e5F:31b18ae4b8b0b0be466ec33560d51935)
- [Awaken Eye](https://highlight.xyz/mint/shape:0xF3851e1b7824BD920350E6Fe9B890bb76d01C9f7)
- [Shapecraft Survivors Genesis](https://highlight.xyz/mint/shape:0xb96f9C2345395Aa7b1A3f3984e398436457e5561)

ACCESS TOKENS:

```
SHAPE_CRAFT_KEY_CONTRACT = "0x05aA491820662b131d285757E5DA4b74BD0F0e5F";
AWAKEN_EYE_CONTRACT = "0xF3851e1b7824BD920350E6Fe9B890bb76d01C9f7";
SHAPECRAFT_SURVIVORS_GENESIS_CONTRACT = "0xb96f9C2345395Aa7b1A3f3984e398436457e5561";
```

URL: https://shapecraft-survivors.vercel.app

Tech Stack:

- Javascript
- NextJs
- Phaser game engine
- Turso / SQLite
- Drizzle ORM
- Web3:
  - Privy Auth + Embedded Wallet
  - Alchemy SDK NFT(s)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Update the .env file with API keys

```bash
#DATABASE
TURSO_CONNECTION_URL=
TURSO_AUTH_TOKEN=
#AUTH
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=
#ETH
ALCHEMY_API_KEY=
#NEXT
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_DOMAIN=
```

Note to Shapecraft Judges:
Indie game development is my new favorite hobby ^\_^ so i'll be continously pushing updates. I've frozen branch `MASTER-HACKATON-SUBMISSON` with all commits prior to hackaton deadline. That branch is pretty similar to master, but ill be fine tuning performance, game logic and various updates. thanks again and hope you have fun playing!!
