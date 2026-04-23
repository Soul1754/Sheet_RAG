import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://research-assistant-backend:8002'}/:path*`,
      },
    ];
  },
  experimental: {
    proxyTimeout: 300000, // 5 minutes
  },
};

export default nextConfig;
