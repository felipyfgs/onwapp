import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/nats",
        destination: "http://localhost:9222",
      },
    ];
  },
};

export default nextConfig;
