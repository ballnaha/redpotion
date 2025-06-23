import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
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
      // Local development subdomain simulation
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'restaurant(?<id>\\w+)\\.localhost:3000',
          },
        ],
        destination: '/restaurant-site/restaurant:id/:path*',
      },
      // Production environment  
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'restaurant(?<id>\\w+)\\.theredpotion\\.com',
          },
        ],
        destination: '/restaurant-site/restaurant:id/:path*',
      },
    ];
  },
};

export default nextConfig;
