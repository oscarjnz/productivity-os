/**
 * PM2 process config for the 1GB VPS.
 *
 * Uses the Next.js standalone server (next.config.ts → output: "standalone").
 * Single fork instance — cluster mode does not fit in 1GB RAM.
 *
 * Deploy expects:
 *   /var/www/dashboard/.next/standalone/server.js   (built output)
 *   /var/www/dashboard/.next/static                 (copied next to standalone)
 *   /var/www/dashboard/public                       (copied next to standalone)
 */
module.exports = {
  apps: [
    {
      name: "productivity-os",
      script: ".next/standalone/server.js",
      cwd: "/var/www/dashboard",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "450M",
      node_args: "--max-old-space-size=512",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",
      },
      error_file: "/var/log/productivity-os/error.log",
      out_file: "/var/log/productivity-os/out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
