import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.cdn.supabase.com",
      },
    ],
  },
  // Ensure environment variables are properly handled
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  typescript: {
    // Strict type checking during build
    tsconfigPath: "./tsconfig.json",
  },
};

export default nextConfig;
