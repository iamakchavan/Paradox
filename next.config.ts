import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable new features from Next.js 15.3
  turbopack: {
    // Add any Turbopack-specific configuration here
    rules: {
      // Example: Configure SVG handling
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Other existing configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Enable experimental features safely
  experimental: {
    scrollRestoration: true,
  },
};

export default nextConfig; 