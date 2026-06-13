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

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Mínimo 3 caracteres"),
  first_name: z.string().min(1, "Requerido"),
  last_name: z.string().min(1, "Requerido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Las contraseñas no coinciden",
  path: ["confirm_password"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError(null);
    try {
      const { confirm_password, ...credentials } = data;
      const response = await authService.register(credentials);
      setAuth(response.user, response.access, response.refresh);
      authService.saveTokens(response.access, response.refresh);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Error al registrarse. Verificá los datos ingresados.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8">
      <h2 className="text-xl font-semibold text-[#EAE6DD] mb-6">
        Crear cuenta
      </h2>

      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#5A6A5A] mb-1">Nombre</label>
            <input
              {...register("first_name")}
              type="text"
              placeholder="Juan"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-[#EAE6DD] rounded px-4 py-3 text-sm focus:outline-none focus:border-[#C8A96B] placeholder-[#5A6A5A]"
            />
            {errors.first_name && (
              <p className="text-red-400 text-xs mt-1">{errors.first_name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-[#5A6A5A] mb-1">Apellido</label>
            <input
              {...register("last_name")}
              type="text"
              placeholder="García"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-[#EAE6DD] rounded px-4 py-3 text-sm focus:outline-none focus:border-[#C8A96B] placeholder-[#5A6A5A]"
            />
            {errors.last_name && (
              <p className="text-red-400 text-xs mt-1">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#5A6A5A] mb-1">Usuario</label>
          <input
            {...register("username")}
            type="text"
            placeholder="juangarcia"
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-[#EAE6DD] rounded px-4 py-3 text-sm focus:outline-none focus:border-[#C8A96B] placeholder-[#5A6A5A]"
          />
          {errors.username && (
            <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-[#5A6A5A] mb-1">Email</label>
          <input
            {...register("email")}
            type="email"
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
            placeholder="••••••••"
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-[#EAE6DD] rounded px-4 py-3 text-sm focus:outline-none focus:border-[#C8A96B] placeholder-[#5A6A5A]"
          />
          {errors.password && (
            <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-[#5A6A5A] mb-1">Confirmar contraseña</label>
          <input
            {...register("confirm_password")}
            type="password"
            placeholder="••••••••"
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-[#EAE6DD] rounded px-4 py-3 text-sm focus:outline-none focus:border-[#C8A96B] placeholder-[#5A6A5A]"
          />
          {errors.confirm_password && (
            <p className="text-red-400 text-xs mt-1">{errors.confirm_password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#C8A96B] text-[#0D0D0D] font-semibold py-3 rounded text-sm hover:bg-[#D4B87A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="text-center text-sm text-[#5A6A5A] mt-6">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-[#C8A96B] hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}

