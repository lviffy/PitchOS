import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: false, // Prevents double-mounting in dev that compounds polling intervals
  transpilePackages: [
    "@pitchos/shared-types",
    "@pitchos/sync-adapter",
    "@pitchos/wallet-adapter",
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
        dns: false,
        http: false,
        https: false,
        readline: false,
        zlib: false,
        constants: false,
      };

      // Redirect client-side @qvac/sdk imports to our browser-friendly shim
      config.resolve.alias = {
        ...config.resolve.alias,
        '@qvac/sdk': path.resolve(__dirname, 'src/lib/qvac-browser-shim.js'),
      };
    }
    return config;
  },
};

export default nextConfig;
