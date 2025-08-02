/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Enable experimental features for better Socket.IO support
  experimental: {
    serverComponentsExternalPackages: ['socket.io'],
  },
}

module.exports = nextConfig