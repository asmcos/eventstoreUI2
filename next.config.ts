import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["eventstore-tools"],
  transpilePackages: ["fumadocs-ui", "fumadocs-core"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8081",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8081",
        pathname: "/uploads/**",
      },
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
