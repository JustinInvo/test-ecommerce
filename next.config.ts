import type { NextConfig } from "next";

/**
 * Next.js 16 configuration.
 *
 * Decisions:
 * - cacheComponents: true -> opt into the new cache model ('use cache',
 *   cacheLife, cacheTag). The whole data layer relies on it.
 * - images.remotePatterns -> required for next/image to optimize remote
 *   product images served by the FakeStore API CDN.
 * - reactStrictMode is left to the default (true) to surface side-effects.
 */
const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fakestoreapi.com",
        pathname: "/img/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["zustand"],
  },
};

export default nextConfig;
