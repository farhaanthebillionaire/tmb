
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co', // Added placehold.co
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https', // For Vercel avatar placeholders
        hostname: 'avatar.vercel.sh',
        port: '',
        pathname: '/**',
      },
      { // For potential Unsplash images if hints are used later
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  experimental: { // Moved serverActions options here
    serverActions: {
      bodySizeLimit: '5mb', // Increased body size limit for Server Actions
    },
  },
};

export default nextConfig;
