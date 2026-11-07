/** @type {import('next').NextConfig} */
const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  // Automatically rewrite local /api/* proxy requests to the configured backend URL
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
