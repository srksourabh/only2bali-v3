import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin file-tracing to this app dir so a parent-repo lockfile can never
  // confuse Next's workspace-root inference (this app lives in a subdirectory).
  outputFileTracingRoot: __dirname,
  // Emit .next/standalone so the runtime image carries only the server and the
  // modules it actually traced, rather than all of node_modules.
  output: "standalone",
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
