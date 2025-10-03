import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fix workspace root warning - set explicit workspace root to parent directory
  outputFileTracingRoot: path.join(__dirname, "../"),

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
