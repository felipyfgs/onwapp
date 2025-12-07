import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  allowedDevOrigins: [
    'localhost',
    'localhost:3000',
    '127.0.0.1:3000'
  ],
  reactStrictMode: true,
};

export default nextConfig;
