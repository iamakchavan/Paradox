import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable new features from Next.js 15.3
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Production optimizations
  // NOTE: compress MUST be false — Next.js compression buffers chunks before
  // sending them, which destroys chunked streaming for /api/chat and
  // /api/chat/research. The routes set their own Cache-Control/no-transform
  // headers, but framework-level gzip overrides those for local streams.
  reactStrictMode: false,
  compress: false,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    scrollRestoration: true,
  },
};

export default nextConfig;