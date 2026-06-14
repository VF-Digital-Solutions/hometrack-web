import { withTamagui } from "@tamagui/next-plugin";

const nextConfig = withTamagui({
  config: "./tamagui.config.ts",
  components: ["tamagui"],
  appDir: true,
  disableExtraction: process.env.NODE_ENV === "development",
})({
  reactStrictMode: true,
  turbopack: {},
  output: "standalone",
  skipTrailingSlashRedirect: true,
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok.app",
    "*.loca.lt",
    "*.tunnel.app",
  ],
  async rewrites() {
    const apiUrl = process.env["API_INTERNAL_URL"] || "http://localhost:8000";
    return [
      {
        source: "/api/v1/:path*/",
        destination: `${apiUrl}/api/v1/:path*/`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
});

export default nextConfig;
