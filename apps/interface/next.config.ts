import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy for standard app routes.
 *
 * default-src 'self'          — baseline: only same-origin resources allowed
 * script-src  'self' + eval  — 'unsafe-eval' required by Next.js HMR in dev
 * style-src   'self' 'unsafe-inline' — Tailwind injects inline styles
 * connect-src 'self' + RPC   — Soroban RPC, Horizon, CoinGecko price feed
 * img-src     'self' data:   — data URIs; Unsplash & IPFS for campaign images
 * font-src    'self'          — self-hosted fonts only
 * frame-ancestors 'none'     — prevents clickjacking
 * object-src  'none'          — disables Flash / legacy plugin embeds
 */
const cspDefault = [
  "default-src 'self'",
  isDev ? "script-src 'self' 'unsafe-eval'" : "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  [
    "connect-src 'self'",
    "https://soroban-testnet.stellar.org",
    "https://horizon-testnet.stellar.org",
    "https://api.coingecko.com",
  ].join(" "),
  "img-src 'self' data: https://images.unsplash.com https://ipfs.io",
  "font-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");

/**
 * Relaxed CSP for the /embed/* route.
 * frame-ancestors is set to '*' so any external site can embed the widget.
 * X-Frame-Options is intentionally omitted for this route (set to ALLOWALL).
 */
const cspEmbed = [
  "default-src 'self'",
  isDev ? "script-src 'self' 'unsafe-eval'" : "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  [
    "connect-src 'self'",
    "https://soroban-testnet.stellar.org",
    "https://horizon-testnet.stellar.org",
    "https://api.coingecko.com",
  ].join(" "),
  "img-src 'self' data: https://images.unsplash.com https://ipfs.io",
  "font-src 'self'",
  "frame-ancestors *",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.ipfs.io" },
      { protocol: "https", hostname: "ipfs.io" },
      { protocol: "https", hostname: "cloudflare-ipfs.com" },
    ],
  },

  async headers() {
    return [
      // ── Service worker — must not be cached ─────────────────────────────────
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
      // ── Embed widget route — allow framing from any origin ──────────────────
      {
        source: "/embed/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspEmbed },
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      // ── Campaign pages — cacheable, invalidate on campaign update ───────────
      {
        source: "/campaigns/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, s-maxage=60, stale-while-revalidate=300" },
          { key: "Surrogate-Key", value: "campaigns" },
          { key: "ETag", value: `"${Date.now()}"` },
        ],
      },
      // ── API-like read responses — cache at edge for 2 minutes ──────────────
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, s-maxage=120, stale-while-revalidate=600" },
          { key: "Surrogate-Key", value: "api" },
        ],
      },
      // ── Static assets (images, fonts, etc.) — long-lived cache ──────────────
      {
        source: "/:all*(svg|png|jpg|jpeg|gif|ico|webp|woff2?|ttf|eot|css|js)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Surrogate-Key", value: "assets" },
        ],
      },
      // ── All other routes — strict security headers, no CDN cache ────────────
      {
        source: "/((?!embed|campaigns|api).*)",
        headers: [
          { key: "Content-Security-Policy", value: cspDefault },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), push=(self), notifications=(self)" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
