import process from "node:process";

const APP_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://";

/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            // The Express health endpoint lives at /health (not /api/health).
            // Map our frontend's /api/health → the backend root /health so the
            // ServerStatusBanner can check liveness without knowing the raw API URL.
            {
                source: "/api/health",
                destination: `${APP_URL}/health`,
            },
            {
                source: "/api/:path*",
                destination: `${APP_URL}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;
