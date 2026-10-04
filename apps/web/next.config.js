import process from "node:process";

const APP_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/+$/, "");

// If NEXT_PUBLIC_API_URL ever points back at this very deployment, proxying
// /api/* to it would resolve to the same rewrite rule forever and Vercel
// answers with a 308 loop. Detect that at build time and skip the proxy so the
// misconfiguration surfaces as a normal 404 instead of an infinite redirect.
const VERCEL_HOST = process.env.VERCEL_URL?.toLowerCase();
const isSelfReference = VERCEL_HOST
    ? APP_URL.toLowerCase().includes(VERCEL_HOST)
    : false;

if (isSelfReference) {
    console.warn(
        `[next.config] NEXT_PUBLIC_API_URL ("${APP_URL}") is this deployment itself; ` +
        "disabling the /api proxy. Point it at the API project instead."
    );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        if (isSelfReference) return [];
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
