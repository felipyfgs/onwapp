import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração para permitir origens específicas em desenvolvimento
  allowedDevOrigins: [
    'localhost',
    'localhost:3000',
    '127.0.0.1:3000'
  ],
  // Configurações adicionais para desenvolvimento
  reactStrictMode: true,
};

export default nextConfig;
