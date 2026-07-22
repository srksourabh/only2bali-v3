import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin file-tracing to this app dir so a parent-repo lockfile can never
  // confuse Next's workspace-root inference (this app lives in a subdirectory).
  outputFileTracingRoot: __dirname,
  // The app deploys to Vercel, which does its own output handling. `standalone`
  // is only wanted for the optional self-hosted Docker path — set DOCKER_BUILD=1
  // for that. Leaving it on unconditionally makes Vercel builds do extra work
  // for output it never uses.
  ...(process.env.DOCKER_BUILD ? { output: "standalone" } : {}),
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
