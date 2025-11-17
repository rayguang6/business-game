import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  images: {
    // Allow images from any domain (for external URLs)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS domains
      },
      {
        protocol: 'http',
        hostname: '**', // Allow all HTTP domains (for localhost/dev)
      },
    ],
    // Also allow Supabase Storage URLs
    domains: [],
    // Unoptimized images for external URLs (optional - set to false if you want Next.js optimization)
    unoptimized: false,
  },
};

export default nextConfig;
