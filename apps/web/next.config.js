import process from "node:process";

const APP_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

/** @type {import('next').NextConfig} */
const nextConfig = {
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
