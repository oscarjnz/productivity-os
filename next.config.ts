import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const config: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Pin the workspace root to this project. A stray lockfile in the user's
  // home directory was causing Next.js to infer the wrong root and emit a
  // build warning; anchor tracing to this folder explicitly.
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "motion",
      "cmdk",
      "@radix-ui/react-slot",
      "@radix-ui/react-dialog",
      "@radix-ui/react-popover",
      "@radix-ui/react-tooltip",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@tanstack/react-query",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "www.google.com", pathname: "/s2/favicons/**" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
      {
        // Never cache HTML documents (page navigations) so the browser always
        // fetches the latest markup. Apply no-store to everything that is NOT a
        // hashed static asset (/_next/static stays immutable), the image
        // optimizer, or a known static file extension. In practice this targets
        // HTML document responses and route handlers.
        source:
          "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:js|css|png|jpg|jpeg|gif|svg|webp|avif|ico|woff|woff2|ttf|otf|eot|map|json|txt|xml|webmanifest)).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default config;
