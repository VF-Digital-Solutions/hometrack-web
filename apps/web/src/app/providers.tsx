"use client";

import { useEffect } from "react";
import { TamaguiProvider } from "tamagui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import appConfig from "../../tamagui.config";
import { useAuthStore } from "@/store/auth";
import { authService } from "@/services/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});

function AuthBootstrap() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
      useAuthStore.getState().setAuth(
        {
          id: "dev-user",
          email: "dev@hometrack.local",
          username: "dev",
          first_name: "Dev",
          last_name: "User",
          phone_number: null,
          avatar_url: null,
          preferred_language: "es",
          timezone: "Europe/Madrid",
        },
        "dev-access-token",
        "dev-refresh-token"
      );
      return;
    }
    const { isAuthenticated, clearAuth } = useAuthStore.getState();
    if (!isAuthenticated) return;
    authService.me().catch(() => clearAuth());
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={appConfig} defaultTheme="dark">
        <AuthBootstrap />
        {children}
      </TamaguiProvider>
    </QueryClientProvider>
  );
}
