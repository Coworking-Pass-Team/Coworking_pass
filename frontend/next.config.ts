import { screenPaths } from "./lib/screen-routes";
import type { NextConfig } from "next";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.8.132',
    '192.168.8.132:3000',
    'localhost',
    'localhost:3000',
    '127.0.0.1',
    '127.0.0.1:3000',
  ],
  async rewrites() {
    return { beforeFiles: Object.values(screenPaths).filter(path => path !== "/").map(path => ({ source: path, destination: "/" })), afterFiles: [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ], fallback: [] };
  },
};

export default nextConfig;
