import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: [
    'localhost',
    'localhost:3000',
    '127.0.0.1:3000'
  ],
  reactStrictMode: true,
};

export default nextConfig;
