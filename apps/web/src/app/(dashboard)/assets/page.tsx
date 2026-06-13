"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import type { Asset, AssetCategory, AssetStatus, HouseholdNode } from "@/types";
import { assetService } from "@/services/assets";
import { householdService } from "@/services/households";

const STATUS_LABELS: Record<AssetStatus, string> = {
  ACTIVE: "Activo",
  IN_REPAIR: "En reparación",
  INACTIVE: "Inactivo",
  DISPOSED: "Dado de baja",
};

const STATUS_STYLES: Record<AssetStatus, string> = {
  ACTIVE: "text-green-400 bg-green-900/10 border-green-800/40",
  IN_REPAIR: "text-amber-400 bg-amber-900/10 border-amber-800/40",
  INACTIVE: "text-[#5A6A5A] bg-[#1A1A1A] border-[#2A2A2A]",
  DISPOSED: "text-red-400 bg-red-900/10 border-red-800/40",
};

function StatusBadge({ status }: { status: AssetStatus }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function AssetCard({ asset }: { asset: Asset }) {
  return (
    <Link href={`/assets/${asset.id}`}>
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-5 hover:border-[#C8A96B] transition-colors cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#C8A96B] font-semibold text-sm shrink-0">
            {asset.name.charAt(0).toUpperCase()}
          </div>
          <StatusBadge status={asset.status} />
        </div>
        <h3 className="text-[#EAE6DD] font-medium text-sm mb-1 group-hover:text-[#C8A96B] transition-colors">
          {asset.name}
        </h3>
        {asset.category_name && (
          <p className="text-[#5A6A5A] text-xs mb-1">{asset.category_name}</p>
        )}
        {(asset.brand || asset.model) && (
          <p className="text-[#5A6A5A] text-xs">
            {[asset.brand, asset.model].filter(Boolean).join(" · ")}
          </p>
        )}
        {asset.location_in_home && (
          <p className="text-[#5A6A5A] text-xs mt-2">{asset.location_in_home}</p>
        )}
      </div>
    </Link>
  );
}

const createSchema = z.object({
  name: z.string().min(1, "Requerido"),
  household_node: z.string().min(1, "Requerido"),
  status: z.enum(["ACTIVE", "IN_REPAIR", "INACTIVE", "DISPOSED"]),
  category: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  location_in_home: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;

function CreateAssetModal({
  households,
  categories,
  onCreated,
  onClose,
}: {
  households: HouseholdNode[];
  categories: AssetCategory[];
  onCreated: (a: Asset) => void;
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
    defaultValues: { status: "ACTIVE" },
  });

  const onSubmit = async (data: CreateForm) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...data,
        category: data.category ? Number(data.category) : null,
        purchase_price: data.purchase_price || null,
        purchase_date: data.purchase_date || null,
      };
      const created = await assetService.create(payload);
      onCreated(created);
      onClose();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al crear el activo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-[#EAE6DD] font-semibold mb-5">Nuevo activo</h2>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Nombre *</label>
              <input
                {...register("name")}
                type="text"
                placeholder="Ej. Televisor Samsung"
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Hogar *</label>
              <select
                {...register("household_node")}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors"
              >
                <option value="">Seleccionar hogar</option>
                {households.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
              {errors.household_node && <p className="text-red-400 text-xs mt-1">{errors.household_node.message}</p>}
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Estado</label>
              <select
                {...register("status")}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors"
              >
                <option value="ACTIVE">Activo</option>
                <option value="IN_REPAIR">En reparación</option>
                <option value="INACTIVE">Inactivo</option>
                <option value="DISPOSED">Dado de baja</option>
              </select>
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Categoría</label>
              <select
                {...register("category")}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Ubicación</label>
              <input
                {...register("location_in_home")}
                type="text"
                placeholder="Ej. Living, cocina"
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Marca</label>
              <input
                {...register("brand")}
                type="text"
                placeholder="Ej. Samsung"
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Modelo</label>
              <input
                {...register("model")}
                type="text"
                placeholder="Ej. QN55Q70C"
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Fecha de compra</label>
              <input
                {...register("purchase_date")}
                type="date"
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Precio de compra</label>
              <input
                {...register("purchase_price")}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Descripción</label>
              <textarea
                {...register("description")}
                rows={2}
                placeholder="Descripción opcional"
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors resize-none"
              />
            </div>
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
              {loading ? "Creando..." : "Crear activo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [households, setHouseholds] = useState<HouseholdNode[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [selectedHousehold, setSelectedHousehold] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([
      assetService.list(),
      householdService.list(),
      assetService.listCategories(),
    ])
      .then(([a, h, c]) => {
        setAssets(a);
        setHouseholds(h);
        setCategories(c);
      })
      .catch(() => setFetchError("No se pudieron cargar los activos."))
      .finally(() => setLoading(false));
  }, []);

  const handleHouseholdFilter = async (householdId: string) => {
    setSelectedHousehold(householdId);
    setLoading(true);
    setFetchError(null);
    try {
      const filtered = await assetService.list(householdId || undefined);
      setAssets(filtered);
    } catch {
      setFetchError("Error al filtrar activos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-[#EAE6DD]">Activos</h2>
          <p className="text-[#5A6A5A] text-sm mt-1">Inventario de bienes del hogar</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm text-[#0D0D0D] bg-[#C8A96B] rounded-md hover:bg-[#b8995b] transition-colors font-medium"
        >
          Nuevo activo
        </button>
      </div>

      {households.length > 0 && (
        <div className="mb-6">
          <select
            value={selectedHousehold}
            onChange={(e) => handleHouseholdFilter(e.target.value)}
            className="bg-[#111111] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors"
          >
            <option value="">Todos los hogares</option>
            {households.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-6 h-6 border-2 border-[#C8A96B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-red-400 text-sm">{fetchError}</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-4">
            <span className="text-[#5A6A5A] text-xl">◻</span>
          </div>
          <p className="text-[#EAE6DD] text-sm font-medium mb-1">Sin activos</p>
          <p className="text-[#5A6A5A] text-xs">No hay activos registrados aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((a) => (
            <AssetCard key={a.id} asset={a} />
          ))}
        </div>
      )}

      {showForm && (
        <CreateAssetModal
          households={households}
          categories={categories}
          onCreated={(a) => setAssets((prev) => [a, ...prev])}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
