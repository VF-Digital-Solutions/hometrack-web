"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import { useAuthStore } from "@/store/auth";
import { authService } from "@/services/auth";

const profileSchema = z.object({
  first_name: z.string().min(1, "Requerido"),
  last_name: z.string().min(1, "Requerido"),
  username: z.string().min(3, "Mínimo 3 caracteres"),
  phone_number: z.string().optional(),
  avatar_url: z.string().url("URL inválida").optional().or(z.literal("")),
  preferred_language: z.enum(["es", "en"]),
  timezone: z.string().min(1, "Requerido"),
});

type ProfileForm = z.infer<typeof profileSchema>;

const TIMEZONES = [
  "UTC",
  "America/Santiago",
  "America/Buenos_Aires",
  "America/Bogota",
  "America/Lima",
  "America/Mexico_City",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Madrid",
  "Europe/London",
];

const inputCls = "w-full appearance-none bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors";
const labelCls = "block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5";

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      phone_number: "",
      avatar_url: "",
      preferred_language: "es",
      timezone: "America/Santiago",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        phone_number: user.phone_number ?? "",
        avatar_url: user.avatar_url ?? "",
        preferred_language: (user.preferred_language as "es" | "en") ?? "es",
        timezone: user.timezone ?? "America/Santiago",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileForm) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await authService.updateProfile({
        ...data,
        phone_number: data.phone_number || null,
        avatar_url: data.avatar_url || null,
      });
      updateUser(updated);
      reset({
        first_name: updated.first_name,
        last_name: updated.last_name,
        username: updated.username,
        phone_number: updated.phone_number ?? "",
        avatar_url: updated.avatar_url ?? "",
        preferred_language: (updated.preferred_language as "es" | "en") ?? "es",
        timezone: updated.timezone ?? "America/Santiago",
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data) {
        const data = err.response.data;
        const msg = data.detail || Object.values(data).flat().join(" ");
        setError(msg);
      } else {
        setError("Error al actualizar el perfil.");
      }
    } finally {
      setLoading(false);
    }
  };

  const initials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : "?";

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-[#EAE6DD]">Mi perfil</h2>
        <p className="text-[#5A6A5A] text-sm mt-1">Información personal y preferencias</p>
      </div>

      {/* Avatar preview */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 mb-4 flex items-center gap-4">
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover border-2 border-[#2A2A2A]"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border-2 border-[#2A2A2A] flex items-center justify-center text-[#C8A96B] font-semibold text-xl">
            {initials}
          </div>
        )}
        <div>
          <p className="text-[#EAE6DD] font-medium">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-[#5A6A5A] text-sm">{user?.email}</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6">
        {success && (
          <div className="bg-green-900/20 border border-green-800 text-green-400 text-sm px-4 py-3 rounded mb-5">
            Perfil actualizado correctamente.
          </div>
        )}
        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nombre *</label>
              <input {...register("first_name")} type="text" placeholder="Tu nombre" className={inputCls} />
              {errors.first_name && <p className="text-red-400 text-xs mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Apellido *</label>
              <input {...register("last_name")} type="text" placeholder="Tu apellido" className={inputCls} />
              {errors.last_name && <p className="text-red-400 text-xs mt-1">{errors.last_name.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Usuario *</label>
              <input {...register("username")} type="text" placeholder="nombre_usuario" className={inputCls} />
              {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <input {...register("phone_number")} type="tel" placeholder="+56 9 1234 5678" className={inputCls} />
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>URL de avatar</label>
              <input {...register("avatar_url")} type="url" placeholder="https://..." className={inputCls} />
              {errors.avatar_url && <p className="text-red-400 text-xs mt-1">{errors.avatar_url.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Idioma</label>
              <select {...register("preferred_language")} className={inputCls}>
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Zona horaria</label>
              <select {...register("timezone")} className={inputCls}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Read-only email */}
          <div className="pt-2 border-t border-[#1E1E1E]">
            <label className={labelCls}>Email</label>
            <p className="text-[#5A6A5A] text-sm py-2">{user?.email}</p>
            <p className="text-[#5A6A5A] text-xs">El email no se puede modificar.</p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || !isDirty}
              className="px-6 py-2 text-sm text-[#0D0D0D] bg-[#C8A96B] rounded-md hover:bg-[#b8995b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
