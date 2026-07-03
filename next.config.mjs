import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/(?!.+\/api\/).*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "apex-http-cache",
        expiration: {
          maxEntries: 160,
          maxAgeSeconds: 30 * 24 * 60 * 60
        },
        networkTimeoutSeconds: 10
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
};

export default withPWA(nextConfig);
