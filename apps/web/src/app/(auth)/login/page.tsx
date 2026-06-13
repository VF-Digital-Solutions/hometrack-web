"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Requerido"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    if (
      process.env.NODE_ENV === "development" &&
      data.email === "test@test.com" &&
      data.password === "test1234"
    ) {
      setAuth(
        {
          id: "local-test",
          email: "test@test.com",
          username: "testuser",
          first_name: "Test",
          last_name: "User",
          phone_number: null,
          avatar_url: null,
          preferred_language: "es",
          timezone: "America/Argentina/Buenos_Aires",
        },
        "dev-access-token",
        "dev-refresh-token"
      );
      router.push("/dashboard");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(data);
      setAuth(response.user, response.access, response.refresh);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al iniciar sesión. Verificá tus credenciales.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8">
      <h2 className="text-xl font-semibold text-[#EAE6DD] mb-6">
        Iniciar sesión
      </h2>

      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} method="post" action="#" className="space-y-4">
        <div>
          <label className="block text-sm text-[#5A6A5A] mb-1">Email</label>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            placeholder="tu@email.com"
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-[#EAE6DD] rounded px-4 py-3 text-sm focus:outline-none focus:border-[#C8A96B] placeholder-[#5A6A5A]"
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-[#5A6A5A] mb-1">Contraseña</label>
          <input
            {...register("password")}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-[#EAE6DD] rounded px-4 py-3 text-sm focus:outline-none focus:border-[#C8A96B] placeholder-[#5A6A5A]"
          />
          {errors.password && (
            <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#C8A96B] text-[#0D0D0D] font-semibold py-3 rounded text-sm hover:bg-[#D4B87A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="text-center text-sm text-[#5A6A5A] mt-6">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="text-[#C8A96B] hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  );
}
