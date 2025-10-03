import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix workspace root warning - mobile-app is the root for this Next.js app
  outputFileTracingRoot: undefined, // Don't trace outside mobile-app directory

  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  webpack: (config, { isServer }) => {
    // Exclude LICENSE files from being processed by webpack
    config.module.rules.push({
      test: /LICENSE$/,
      type: 'asset/source',
    });
    
    // Ignore .node files for better compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
};

export default nextConfig;
