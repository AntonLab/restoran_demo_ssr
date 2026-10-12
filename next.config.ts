import type { NextConfig } from "next";

// No script-src or style-src: Next's inline scripts would need per-request nonces.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Keeps the guest view token in ?t= out of the Referer header.
  { key: "Referrer-Policy", value: "same-origin" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  headers: async () => [{ source: "/:path*", headers: securityHeaders }],
};

export default nextConfig;
