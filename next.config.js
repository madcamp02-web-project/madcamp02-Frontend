/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://madcampbackend.royaljellynas.org/api/:path*",
      },
      {
        source: "/oauth2/:path*",
        destination: "http://madcampbackend.royaljellynas.org/oauth2/:path*",
      },
    ];
  },
};

module.exports = nextConfig;

