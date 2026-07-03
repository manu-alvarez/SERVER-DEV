import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  basePath: '/app/elitescout',
  reactStrictMode: true,
  trailingSlash: true,
  output: process.env.NEXT_SERVER_MODE === "true" ? undefined : "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
