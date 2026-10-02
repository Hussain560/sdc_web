import type { NextConfig } from 'next';

// next-intl's `createNextIntlPlugin` loads a native SWC addon that fails on some Windows setups
// (ACL check), so we register the request config alias it would have added ourselves.
const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: { 'next-intl/config': './src/i18n/request.ts' },
  },
};

export default nextConfig;
