import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @ts-ignore
  turbopack: {
    root: process.cwd(),
  },
  cacheComponents: true,
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ijlyviwppydvzsmm.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
        search: '',
      },
    ],
  },
};

export default nextConfig;
