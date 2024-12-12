/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "@privy-io/react-auth",
      "@phosphor-icons/react",
      "@alch/alchemy-web3",
    ],
  },
  images: {
    domains: ["ipfs.io", "gateway.ipfs.io", "cf-ipfs.com"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        port: '',
        pathname: '/profile_images/**',
      },
    ],
  },
};

export default nextConfig;
