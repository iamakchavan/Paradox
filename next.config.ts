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
  swcMinify: true,
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
  // Improved error handling
  onError: (err: Error) => {
    console.error('Next.js build error:', err);
  },
  // Enable experimental features safely
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
};

export default nextConfig; 