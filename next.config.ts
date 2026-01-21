import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://madcampbackend.royaljellynas.org/api/:path*',
      },
      {
        source: '/oauth2/:path*',
        destination: 'http://madcampbackend.royaljellynas.org/oauth2/:path*',
      },
    ];
  },
};

export default nextConfig;
