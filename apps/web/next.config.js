// next.config.ts
import { NextConfig } from "next";
import { APP_URL } from "./config/env";
const nextConfig = NextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: `${APP_URL}/api/:path*`,
            },
        ];
    },
};
export default nextConfig;