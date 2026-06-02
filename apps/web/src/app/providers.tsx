"use client";

import { TamaguiProvider } from "tamagui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import appConfig from "../../tamagui.config";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={appConfig} defaultTheme="dark">
        {children}
      </TamaguiProvider>
    </QueryClientProvider>
  );
}

