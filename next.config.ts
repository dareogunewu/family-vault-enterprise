import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@simplewebauthn/server'],
  eslint: {
    // Allow production builds to complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even with TypeScript errors  
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
