import { config } from "@tamagui/config/v3";
import { createTamagui } from "tamagui";

const appConfig = createTamagui({
  ...config,
  tokens: {
    ...config.tokens,
    color: {
      ...config.tokens.color,
      background: "#0D0D0D",
      foreground: "#EAE6DD",
      primary: "#C8A96B",
      secondary: "#1A1A1A",
      muted: "#5A6A5A",
      border: "#2A2A2A",
    },
  },
  themes: {
    dark: {
      background: "#0D0D0D",
      backgroundHover: "#111111",
      backgroundPress: "#1A1A1A",
      backgroundFocus: "#1A1A1A",
      borderColor: "#2A2A2A",
      borderColorHover: "#C8A96B",
      color: "#EAE6DD",
      colorHover: "#FFFFFF",
      colorPress: "#C8A96B",
      colorFocus: "#EAE6DD",
      placeholderColor: "#5A6A5A",
      outlineColor: "#C8A96B",
    },
    light: {
      background: "#EAE6DD",
      backgroundHover: "#F5F2EC",
      backgroundPress: "#DDD9D0",
      backgroundFocus: "#DDD9D0",
      borderColor: "#C8C4BB",
      borderColorHover: "#C8A96B",
      color: "#0D0D0D",
      colorHover: "#1A1A1A",
      colorPress: "#C8A96B",
      colorFocus: "#0D0D0D",
      placeholderColor: "#8A8A7A",
      outlineColor: "#C8A96B",
    },
  },
});

export type AppConfig = typeof appConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig;
