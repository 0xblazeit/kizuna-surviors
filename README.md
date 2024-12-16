# ShapeCraft Survivors

Use NFT(s) found across various collections/worlds as in game playable assets/unlockables in a 2D roguelike survival game inspired by "Vampire Survivors" where players unleash chaos in a relentless bullet firestorm to fend off endless waves of enemies while upgrading weapons. Token gated by NFT(s) found on-chain @ [Shape L2](https://shape.network/).

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

Update the .env file with your API keys

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
