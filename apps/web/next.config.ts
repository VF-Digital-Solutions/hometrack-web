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
  allowedDevOrigins: ["192.168.1.127"],
});

export default nextConfig;
