import type { NextConfig } from 'next';
import { buildSecurityHeaders } from './src/lib/security-headers';

// next-intl's `createNextIntlPlugin` loads a native SWC addon that fails on some Windows setups
// (ACL check), so we register the request config alias it would have added ourselves.
// The certificate PDF reads its fonts and logo from disk at run time: make sure serverless builds ship them.
const certificateAssets = [
  './public/assets/navbar.png',
  './public/assets/font/IBM_Plex_Sans_Arabic/IBMPlexSansArabic-Regular.ttf',
  './public/assets/font/IBM_Plex_Sans_Arabic/IBMPlexSansArabic-Bold.ttf',
  './public/assets/font/Inter/static/Inter_18pt-Regular.ttf',
  './public/assets/font/Inter/static/Inter_18pt-SemiBold.ttf',
];

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/[locale]/dashboard/events/[id]/attendance': certificateAssets,
    '/api/certificates/[id]/pdf': certificateAssets,
  },
  // Lets the auth E2E suite run its own dev server without clobbering the main build output.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Next 16 blocks dev assets requested via 127.0.0.1 (used by the E2E suites) unless allowed.
  allowedDevOrigins: ['127.0.0.1'],
  // /committee (the old registrations review page) moved into the dashboard shell in Sprint 06.
  // SEC-002: the same headers on every route (CSP enforced, nosniff, frame denial, referrer, permissions, HSTS in production).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: buildSecurityHeaders({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          production: process.env.NODE_ENV === 'production',
          // Only on the real https host: a local production build runs on http and must keep working.
          upgradeInsecure: !!process.env.VERCEL,
        }),
      },
    ];
  },
  async redirects() {
    return [
      { source: '/committee', destination: '/dashboard/registrations', permanent: true },
      { source: '/en/committee', destination: '/en/dashboard/registrations', permanent: true },
    ];
  },
  turbopack: {
    resolveAlias: { 'next-intl/config': './src/i18n/request.ts' },
  },
};

export default nextConfig;
