const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https?:\/\/.*\/api\/v1\/(dashboard|tasks|attendance|calendar|intelligence).*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-data-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24,
          },
          networkTimeoutSeconds: 5,
        },
      },
    ],
  },
});

const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
