import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Prevents double-mounting in dev that compounds polling intervals
  transpilePackages: [
    "@pitchos/shared-types",
    "@pitchos/sync-adapter",
    "@pitchos/wallet-adapter",
  ],
};

export default nextConfig;
