import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/**",
          },
        ]
      : [],
    formats: ["image/avif", "image/webp"],
  },
  typedRoutes: true,
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3001",
        "improved-orbit-5ggg6v9x9p762ppqq-3000.app.github.dev",
      ],
    },
  },
};

export default nextConfig;