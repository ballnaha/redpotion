import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  
  // Disable linting during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable type checking during build (optional)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  images: {
    domains: ['images.unsplash.com'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // Local development subdomain simulation (รองรับทั้ง legacy และ shortcode)
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'restaurant(?<id>\\d+)\\.localhost:3000',
          },
        ],
        destination: '/restaurant-site/restaurant:id/:path*',
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'r(?<id>\\d+)\\.localhost:3000',
          },
        ],
        destination: '/restaurant-site/r:id/:path*',
      },
      // Production environment (รองรับทั้ง legacy และ shortcode)
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'restaurant(?<id>\\d+)\\.theredpotion\\.com',
          },
        ],
        destination: '/restaurant-site/restaurant:id/:path*',
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'r(?<id>\\d+)\\.theredpotion\\.com',
          },
        ],
        destination: '/restaurant-site/r:id/:path*',
      },
    ];
  },
};

export default nextConfig;
