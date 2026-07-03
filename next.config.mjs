import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  clientsClaim: true,
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
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
          { key: "Pragma", value: "no-cache" }
        ]
      }
    ];
  }
};

export default withPWA(nextConfig);
