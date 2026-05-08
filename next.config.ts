import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "moodlesync-saas.vercel.app" }],
        destination: "https://moodlesync.onyxinc.dev/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value:
              "moodlesync-saas-alcantarfloresjuan-4466s-projects.vercel.app",
          },
        ],
        destination: "https://moodlesync.onyxinc.dev/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
