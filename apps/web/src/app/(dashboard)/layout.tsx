"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { authService } from "@/services/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, refreshToken } = useAuthStore();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const devBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated && !devBypass) {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, router, devBypass]);

  if (!mounted) return null;
  if (!isAuthenticated && !devBypass) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } finally {
      useAuthStore.getState().clearAuth();
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A0A0A] border-r border-[#2A2A2A] hidden md:flex flex-col">
        <div className="p-6 border-b border-[#2A2A2A]">
          <h1 className="text-lg font-bold text-[#EAE6DD] tracking-widest uppercase">
            HomeTrack
          </h1>
        </div>
        <nav className="flex-1 p-4">
          <p className="text-[#5A6A5A] text-xs uppercase tracking-wider mb-3">
            Módulos
          </p>
          {[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Hogares", href: "/households" },
            { label: "Activos", href: "/assets" },
            { label: "Finanzas", href: "/finances" },
            { label: "Rutinas", href: "/routines" },
            { label: "Reservas", href: "/reservations" },
            { label: "Beneficios", href: "/benefits" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 text-sm text-[#EAE6DD] hover:text-[#C8A96B] hover:bg-[#1A1A1A] rounded transition-colors mb-1"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        <header className="h-14 bg-[#0A0A0A] border-b border-[#2A2A2A] flex items-center justify-end px-6">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-sm text-[#5A6A5A] hover:text-[#C8A96B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>
        </header>
        <div className="flex-1 p-6">{children}</div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#2A2A2A] flex md:hidden">
        {[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Activos", href: "/assets" },
          { label: "Finanzas", href: "/finances" },
          { label: "Rutinas", href: "/routines" },
          { label: "Reservas", href: "/reservations" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 py-3 text-center text-xs text-[#5A6A5A] hover:text-[#C8A96B] transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
