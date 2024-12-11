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
};

export default nextConfig;
