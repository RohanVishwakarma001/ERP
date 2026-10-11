import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/** Origin of the backend API (and its Socket.IO gateway), for connect-src. */
function apiOrigins(): string[] {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1");
    const ws = `${url.protocol === "https:" ? "wss:" : "ws:"}//${url.host}`;
    return [url.origin, ws];
  } catch {
    return [];
  }
}

const RAZORPAY = ["https://checkout.razorpay.com", "https://api.razorpay.com"];

/**
 * Content-Security-Policy. `'unsafe-inline'` scripts are required by Next.js
 * hydration without per-request nonces; everything else is an explicit allowlist,
 * so an injected <script src> or exfiltration request to an unknown host is blocked.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://checkout.razorpay.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://upload.wikimedia.org",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigins().join(" ")} ${RAZORPAY.join(" ")} https://lumberjack.razorpay.com ${isDev ? "ws: http://localhost:* http://*:8000" : ""}`,
  `frame-src ${RAZORPAY.join(" ")}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
]
  .map((d) => d.replace(/\s+/g, " ").trim())
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Camera is used by the attendance QR scanner and geolocation by the geofence check.
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=(), payment=(self \"https://checkout.razorpay.com\")" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  // Never ship source maps to browsers — they expose the full original source.
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
