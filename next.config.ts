import type { NextConfig } from 'next';

// next-intl's `createNextIntlPlugin` loads a native SWC addon that fails on some Windows setups
// (ACL check), so we register the request config alias it would have added ourselves.
const nextConfig: NextConfig = {
  // Lets the auth E2E suite run its own dev server without clobbering the main build output.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Next 16 blocks dev assets requested via 127.0.0.1 (used by the E2E suites) unless allowed.
  allowedDevOrigins: ['127.0.0.1'],
  turbopack: {
    resolveAlias: { 'next-intl/config': './src/i18n/request.ts' },
  },
};

export default nextConfig;
