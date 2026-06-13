"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import type { HouseholdNode, HouseholdType } from "@/types";
import { householdService } from "@/services/households";

const MOCK_HOUSEHOLDS: HouseholdNode[] = [
  {
    id: "1a2b3c4d-0000-0000-0000-000000000001",
    name: "Casa Principal",
    description: "Hogar familiar en la ciudad",
    type: "FAMILY",
    parent: null,
    avatar_url: null,
    address: { city: "Madrid", country: "España" },
    settings: {},
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-03-20T08:30:00Z",
  },
  {
    id: "1a2b3c4d-0000-0000-0000-000000000002",
    name: "Apartamento de Verano",
    description: "Piso en la costa para vacaciones",
    type: "INDIVIDUAL",
    parent: null,
    avatar_url: null,
    address: { city: "Valencia", country: "España" },
    settings: {},
    created_at: "2024-06-01T12:00:00Z",
    updated_at: "2024-06-01T12:00:00Z",
  },
];

const TYPE_LABELS: Record<HouseholdType, string> = {
  INDIVIDUAL: "Individual",
  FAMILY: "Familiar",
  COMMUNITY: "Comunidad",
};

const createSchema = z.object({
  name: z.string().min(1, "Requerido"),
  description: z.string().optional(),
  type: z.enum(["INDIVIDUAL", "FAMILY", "COMMUNITY"]),
});

type CreateForm = z.infer<typeof createSchema>;

function HouseholdCard({ household }: { household: HouseholdNode }) {
  return (
    <Link href={`/households/${household.id}`}>
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-5 hover:border-[#C8A96B] transition-colors cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#C8A96B] font-semibold text-sm">
            {household.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full border border-[#2A2A2A] text-[#5A6A5A]">
            {TYPE_LABELS[household.type]}
          </span>
        </div>
        <h3 className="text-[#EAE6DD] font-medium text-sm mb-1 group-hover:text-[#C8A96B] transition-colors">
          {household.name}
        </h3>
        <p className="text-[#5A6A5A] text-xs line-clamp-2">{household.description}</p>
        <p className="text-[#5A6A5A] text-xs mt-3">
          {household.address?.city ? String(household.address.city) : "—"}
        </p>
      </div>
    </Link>
  );
}

function HouseholdForm({
  onCreated,
  onClose,
}: {
  onCreated: (h: HouseholdNode) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { type: "INDIVIDUAL" },
  });

  const onSubmit = async (data: CreateForm) => {
    setLoading(true);
    setError(null);
    try {
      const created = await householdService.create(data);
      onCreated(created);
      onClose();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al crear el hogar. Intentá de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-[#EAE6DD] font-semibold mb-5">Nuevo hogar</h2>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">
              Nombre
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder="Mi hogar"
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors"
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">
              Descripción
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Descripción opcional"
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">
              Tipo
            </label>
            <select
              {...register("type")}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors"
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="FAMILY">Familiar</option>
              <option value="COMMUNITY">Comunidad</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm text-[#5A6A5A] border border-[#2A2A2A] rounded-md hover:text-[#EAE6DD] hover:border-[#5A6A5A] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm text-[#0D0D0D] bg-[#C8A96B] rounded-md hover:bg-[#b8995b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creando..." : "Crear hogar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HouseholdsPage() {
  const [showForm, setShowForm] = useState(false);
  const [households, setHouseholds] = useState<HouseholdNode[]>(MOCK_HOUSEHOLDS);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-[#EAE6DD]">Hogares</h2>
          <p className="text-[#5A6A5A] text-sm mt-1">Tus hogares registrados</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm text-[#0D0D0D] bg-[#C8A96B] rounded-md hover:bg-[#b8995b] transition-colors font-medium"
        >
          Nuevo hogar
        </button>
      </div>

      {households.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-4">
            <span className="text-[#5A6A5A] text-xl">⌂</span>
          </div>
          <p className="text-[#EAE6DD] text-sm font-medium mb-1">Sin hogares</p>
          <p className="text-[#5A6A5A] text-xs">No tienes ningún hogar registrado aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {households.map((h) => (
            <HouseholdCard key={h.id} household={h} />
          ))}
        </div>
      )}

      {showForm && (
        <HouseholdForm
          onCreated={(h) => setHouseholds((prev) => [h, ...prev])}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
