/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable experimental features if needed
  },
  // Disable strict mode for WebRTC compatibility
  reactStrictMode: false,
  // Enable SWC minification for better performance
  swcMinify: true,
  // Configure headers for WebRTC and Socket.IO
  async headers() {
    return [
      {
        source: '/api/socket',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  // Configure redirects for better UX
  async redirects() {
    return [
      {
        source: '/',
        destination: '/broadcast',
        permanent: false,
      },
    ];
  },
  // Webpack configuration for Socket.IO compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        dns: false,
        tls: false,
        fs: false,
        request: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;