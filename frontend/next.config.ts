import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    // This runs SERVER-SIDE inside Docker, so we can always use
    // the internal Docker hostname 'research-assistant-backend'
    const backendUrl = process.env.INTERNAL_API_URL
      || process.env.NEXT_PUBLIC_API_URL
      || (process.env.NODE_ENV === "development" ? "http://localhost:8002" : "http://research-assistant-backend:8002");
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  experimental: {
    // Large PDF uploads are handled via direct connection or server-side configuration
  },
};

export default nextConfig;
