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
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development' 
              ? 'no-cache, no-store, must-revalidate' 
              : 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
          },
        ],
      },
      // Static assets can be cached longer
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Uploads folder should also be cached
      {
        source: '/uploads/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // API routes should not be cached
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // Static file serving for uploads - redirect to API route in production
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
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
