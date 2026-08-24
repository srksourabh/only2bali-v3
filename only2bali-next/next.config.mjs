import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin file-tracing to this app dir so a parent-repo lockfile can never
  // confuse Next's workspace-root inference (this app lives in a subdirectory).
  outputFileTracingRoot: __dirname,
  // /api/ops/migrate runs drizzle-orm/migrator, which reads SQL from disk.
  outputFileTracingIncludes: {
    "/api/health": ["./lib/db/migrations/**/*"],
    "/api/ops/migrate": ["./lib/db/migrations/**/*"],
  },
  // The app deploys to Vercel, which does its own output handling. `standalone`
  // is only wanted for the optional self-hosted Docker path — set DOCKER_BUILD=1
  // for that. Leaving it on unconditionally makes Vercel builds do extra work
  // for output it never uses.
  ...(process.env.DOCKER_BUILD ? { output: "standalone" } : {}),
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
