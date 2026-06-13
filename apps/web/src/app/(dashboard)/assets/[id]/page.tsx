"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import type {
  Asset,
  AssetCategory,
  AssetDocument,
  AssetStatus,
  DocumentType,
  MaintenanceRecord,
  MaintenanceStatus,
  MaintenanceType,
} from "@/types";
import { assetService } from "@/services/assets";

// ── Status helpers ─────────────────────────────────────────────────────────────

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

const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  SCHEDULED: "Programado",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const MAINTENANCE_STATUS_STYLES: Record<MaintenanceStatus, string> = {
  SCHEDULED: "text-blue-400 bg-blue-900/10 border-blue-800/40",
  IN_PROGRESS: "text-amber-400 bg-amber-900/10 border-amber-800/40",
  COMPLETED: "text-green-400 bg-green-900/10 border-green-800/40",
  CANCELLED: "text-[#5A6A5A] bg-[#1A1A1A] border-[#2A2A2A]",
};

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  INVOICE: "Factura",
  MANUAL: "Manual",
  WARRANTY: "Garantía",
  PHOTO: "Foto",
  OTHER: "Otro",
};

const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  PREVENTIVE: "Preventivo",
  CORRECTIVE: "Correctivo",
  INSPECTION: "Inspección",
  CLEANING: "Limpieza",
};

function StatusBadge({ status }: { status: AssetStatus }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${MAINTENANCE_STATUS_STYLES[status]}`}>
      {MAINTENANCE_STATUS_LABELS[status]}
    </span>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-CL");
}

// ── Edit Asset Modal ───────────────────────────────────────────────────────────

const editSchema = z.object({
  name: z.string().min(1, "Requerido"),
  status: z.enum(["ACTIVE", "IN_REPAIR", "INACTIVE", "DISPOSED"]),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  location_in_home: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.string().optional(),
  warranty_expiry: z.string().optional(),
});

type EditForm = z.infer<typeof editSchema>;

function EditAssetModal({
  asset,
  categories,
  onSaved,
  onClose,
}: {
  asset: Asset;
  categories: AssetCategory[];
  onSaved: (a: Asset) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    asset.category ? String(asset.category) : ""
  );

  const { register, handleSubmit, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: asset.name,
      status: asset.status,
      description: asset.description,
      brand: asset.brand,
      model: asset.model,
      serial_number: asset.serial_number,
      location_in_home: asset.location_in_home,
      purchase_date: asset.purchase_date ?? undefined,
      purchase_price: asset.purchase_price ?? undefined,
      warranty_expiry: asset.warranty_expiry ?? undefined,
    },
  });

  const onSubmit = async (data: EditForm) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await assetService.update(asset.id, {
        ...data,
        category: selectedCategory ? Number(selectedCategory) : null,
        purchase_price: data.purchase_price || null,
        purchase_date: data.purchase_date || null,
        warranty_expiry: data.warranty_expiry || null,
      });
      onSaved(updated);
      onClose();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.detail) setError(err.response.data.detail);
      else if (err instanceof Error) setError(err.message);
      else setError("Error al actualizar el activo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-[#EAE6DD] font-semibold mb-5">Editar activo</h2>
        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded mb-4">{error}</div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Nombre *</label>
              <input {...register("name")} type="text" className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Estado</label>
              <select {...register("status")} className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors">
                <option value="ACTIVE">Activo</option>
                <option value="IN_REPAIR">En reparación</option>
                <option value="INACTIVE">Inactivo</option>
                <option value="DISPOSED">Dado de baja</option>
              </select>
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Categoría</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors">
                <option value="">Sin categoría</option>
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Marca</label>
              <input {...register("brand")} type="text" className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors" />
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Modelo</label>
              <input {...register("model")} type="text" className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors" />
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">N° de serie</label>
              <input {...register("serial_number")} type="text" className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors" />
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Ubicación</label>
              <input {...register("location_in_home")} type="text" className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors" />
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Fecha de compra</label>
              <input {...register("purchase_date")} type="date" className="w-full appearance-none bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors" />
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Precio de compra</label>
              <input {...register("purchase_price")} type="number" step="0.01" min="0" className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors" />
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Vencimiento garantía</label>
              <input {...register("warranty_expiry")} type="date" className="w-full appearance-none bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Descripción</label>
              <textarea {...register("description")} rows={2} className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors resize-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-2 text-sm text-[#5A6A5A] border border-[#2A2A2A] rounded-md hover:text-[#EAE6DD] hover:border-[#5A6A5A] transition-colors disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 text-sm text-[#0D0D0D] bg-[#C8A96B] rounded-md hover:bg-[#b8995b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">{loading ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Asset Modal ─────────────────────────────────────────────────────────

function DeleteAssetModal({
  assetName,
  onConfirm,
  onClose,
}: {
  assetName: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } catch {
      setError("No se pudo eliminar el activo.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-sm">
        <h2 className="text-[#EAE6DD] font-semibold mb-2">Eliminar activo</h2>
        <p className="text-[#5A6A5A] text-sm mb-5">¿Estás seguro que quieres eliminar <span className="text-[#EAE6DD]">{assetName}</span>? Esta acción no se puede deshacer.</p>
        {error && <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded mb-4">{error}</div>}
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2 text-sm text-[#5A6A5A] border border-[#2A2A2A] rounded-md hover:text-[#EAE6DD] hover:border-[#5A6A5A] transition-colors disabled:opacity-50">Cancelar</button>
          <button onClick={handleConfirm} disabled={loading} className="flex-1 px-4 py-2 text-sm text-white bg-red-700 rounded-md hover:bg-red-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">{loading ? "Eliminando..." : "Eliminar"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Upload Document Modal ──────────────────────────────────────────────────────

const uploadSchema = z.object({
  name: z.string().min(1, "Requerido"),
  type: z.enum(["INVOICE", "MANUAL", "WARRANTY", "PHOTO", "OTHER"]),
});

type UploadForm = z.infer<typeof uploadSchema>;

function UploadDocumentModal({
  assetId,
  onUploaded,
  onClose,
}: {
  assetId: string;
  onUploaded: (doc: AssetDocument) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { type: "OTHER" },
  });

  const onSubmit = async (data: UploadForm) => {
    if (!selectedFile) {
      setError("Selecciona un archivo.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const doc = await assetService.uploadDocument(assetId, {
        name: data.name,
        type: data.type,
        file: selectedFile,
      });
      onUploaded(doc);
      onClose();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.detail) setError(err.response.data.detail);
      else if (err instanceof Error) setError(err.message);
      else setError("Error al subir el documento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-md">
        <h2 className="text-[#EAE6DD] font-semibold mb-5">Subir documento</h2>
        {error && <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Nombre *</label>
            <input {...register("name")} type="text" placeholder="Ej. Factura de compra" className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Tipo</label>
            <select {...register("type")} className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors">
              <option value="INVOICE">Factura</option>
              <option value="MANUAL">Manual</option>
              <option value="WARRANTY">Garantía</option>
              <option value="PHOTO">Foto</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Archivo *</label>
            <div
              className="w-full bg-[#0D0D0D] border border-dashed border-[#2A2A2A] rounded-md px-3 py-4 text-sm text-center cursor-pointer hover:border-[#C8A96B] transition-colors"
              onClick={() => document.getElementById("doc-file-input")?.click()}
            >
              {selectedFile ? (
                <span className="text-[#EAE6DD]">{selectedFile.name}</span>
              ) : (
                <span className="text-[#5A6A5A]">Haz clic para seleccionar un archivo</span>
              )}
            </div>
            <input
              id="doc-file-input"
              type="file"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-2 text-sm text-[#5A6A5A] border border-[#2A2A2A] rounded-md hover:text-[#EAE6DD] hover:border-[#5A6A5A] transition-colors disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 text-sm text-[#0D0D0D] bg-[#C8A96B] rounded-md hover:bg-[#b8995b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">{loading ? "Subiendo..." : "Subir"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Create Maintenance Modal ───────────────────────────────────────────────────

const maintenanceSchema = z.object({
  title: z.string().min(1, "Requerido"),
  type: z.enum(["PREVENTIVE", "CORRECTIVE", "INSPECTION", "CLEANING"]),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  scheduled_at: z.string().min(1, "Requerido"),
  completed_at: z.string().optional(),
  cost: z.string().optional(),
  currency: z.string().optional(),
  provider_name: z.string().optional(),
  notes: z.string().optional(),
});

type MaintenanceForm = z.infer<typeof maintenanceSchema>;

function CreateMaintenanceModal({
  assetId,
  onCreated,
  onClose,
}: {
  assetId: string;
  onCreated: (r: MaintenanceRecord) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<MaintenanceForm>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { status: "SCHEDULED", type: "PREVENTIVE" },
  });

  const onSubmit = async (data: MaintenanceForm) => {
    setLoading(true);
    setError(null);
    try {
      const record = await assetService.createMaintenance(assetId, {
        ...data,
        cost: data.cost || null,
        completed_at: data.completed_at || null,
      });
      onCreated(record);
      onClose();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.detail) setError(err.response.data.detail);
      else if (err instanceof Error) setError(err.message);
      else setError("Error al crear el mantenimiento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-[#EAE6DD] font-semibold mb-5">Nuevo mantenimiento</h2>
        {error && <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Título *</label>
              <input {...register("title")} type="text" placeholder="Ej. Revisión anual" className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors" />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Tipo *</label>
              <select {...register("type")} className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors">
                <option value="PREVENTIVE">Preventivo</option>
                <option value="CORRECTIVE">Correctivo</option>
                <option value="INSPECTION">Inspección</option>
                <option value="CLEANING">Limpieza</option>
              </select>
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Estado</label>
              <select {...register("status")} className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors">
                <option value="SCHEDULED">Programado</option>
                <option value="IN_PROGRESS">En progreso</option>
                <option value="COMPLETED">Completado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Fecha programada *</label>
              <input {...register("scheduled_at")} type="datetime-local" className="w-full appearance-none bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors" />
              {errors.scheduled_at && <p className="text-red-400 text-xs mt-1">{errors.scheduled_at.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Fecha completado</label>
              <input {...register("completed_at")} type="datetime-local" className="w-full appearance-none bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors" />
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Costo</label>
              <input {...register("cost")} type="number" step="0.01" min="0" placeholder="0.00" className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors" />
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Moneda</label>
              <input {...register("currency")} type="text" placeholder="CLP" className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Proveedor</label>
              <input {...register("provider_name")} type="text" placeholder="Nombre del proveedor" className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Notas</label>
              <textarea {...register("notes")} rows={2} placeholder="Observaciones adicionales" className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors resize-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-2 text-sm text-[#5A6A5A] border border-[#2A2A2A] rounded-md hover:text-[#EAE6DD] hover:border-[#5A6A5A] transition-colors disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 text-sm text-[#0D0D0D] bg-[#C8A96B] rounded-md hover:bg-[#b8995b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">{loading ? "Creando..." : "Crear"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

type Modal = "edit" | "delete" | "upload" | "maintenance" | null;

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [a, docs, maint, cats] = await Promise.all([
        assetService.getById(id),
        assetService.listDocuments(id),
        assetService.listMaintenance(id),
        assetService.listCategories(),
      ]);
      setAsset(a);
      setDocuments(docs);
      setMaintenance(maint);
      setCategories(cats);
    } catch {
      setFetchError("No se pudo cargar el activo.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    await assetService.remove(id);
    router.push("/assets");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-6 h-6 border-2 border-[#C8A96B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError || !asset) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-red-400 text-sm mb-4">{fetchError ?? "Activo no encontrado."}</p>
        <Link href="/assets" className="text-[#C8A96B] text-sm hover:underline">Volver a activos</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#5A6A5A] mb-6">
        <Link href="/assets" className="hover:text-[#C8A96B] transition-colors">Activos</Link>
        <span>/</span>
        <span className="text-[#EAE6DD]">{asset.name}</span>
      </div>

      {/* Header */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-semibold text-[#EAE6DD]">{asset.name}</h2>
              <StatusBadge status={asset.status} />
            </div>
            {asset.category_name && <p className="text-[#5A6A5A] text-sm">{asset.category_name}</p>}
            {asset.description && <p className="text-[#5A6A5A] text-sm mt-2">{asset.description}</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setModal("edit")}
              className="px-4 py-2 text-sm text-[#EAE6DD] border border-[#2A2A2A] rounded-md hover:border-[#C8A96B] hover:text-[#C8A96B] transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => setModal("delete")}
              className="px-4 py-2 text-sm text-red-400 border border-red-900/40 rounded-md hover:bg-red-900/10 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 mb-4">
        <h3 className="text-[#EAE6DD] font-medium text-sm mb-4">Información</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Marca", value: asset.brand || "—" },
            { label: "Modelo", value: asset.model || "—" },
            { label: "N° de serie", value: asset.serial_number || "—" },
            { label: "Ubicación", value: asset.location_in_home || "—" },
            { label: "Fecha de compra", value: formatDate(asset.purchase_date) },
            { label: "Precio de compra", value: asset.purchase_price ? `$${asset.purchase_price}` : "—" },
            { label: "Garantía", value: formatDate(asset.warranty_expiry) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[#5A6A5A] text-xs uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-[#EAE6DD] text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Documents */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#EAE6DD] font-medium text-sm">Documentos ({documents.length})</h3>
          <button
            onClick={() => setModal("upload")}
            className="px-3 py-1.5 text-xs text-[#C8A96B] border border-[#C8A96B]/30 rounded-md hover:bg-[#C8A96B]/10 transition-colors"
          >
            Subir documento
          </button>
        </div>
        {documents.length === 0 ? (
          <p className="text-[#5A6A5A] text-sm">No hay documentos adjuntos.</p>
        ) : (
          <div className="divide-y divide-[#1E1E1E]">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-[#EAE6DD] text-sm">{doc.name}</p>
                  <p className="text-[#5A6A5A] text-xs">{DOC_TYPE_LABELS[doc.type]} · {formatDate(doc.created_at)}</p>
                </div>
                {doc.file_url && (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#C8A96B] hover:underline shrink-0 ml-4"
                  >
                    Descargar
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Maintenance */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#EAE6DD] font-medium text-sm">Mantenimientos ({maintenance.length})</h3>
          <button
            onClick={() => setModal("maintenance")}
            className="px-3 py-1.5 text-xs text-[#C8A96B] border border-[#C8A96B]/30 rounded-md hover:bg-[#C8A96B]/10 transition-colors"
          >
            Agregar mantenimiento
          </button>
        </div>
        {maintenance.length === 0 ? (
          <p className="text-[#5A6A5A] text-sm">No hay registros de mantenimiento.</p>
        ) : (
          <div className="divide-y divide-[#1E1E1E]">
            {maintenance.map((m) => (
              <div key={m.id} className="py-3">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <p className="text-[#EAE6DD] text-sm font-medium">{m.title}</p>
                  <MaintenanceStatusBadge status={m.status} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                  <p className="text-[#5A6A5A] text-xs">{MAINTENANCE_TYPE_LABELS[m.type]}</p>
                  <p className="text-[#5A6A5A] text-xs">{formatDate(m.scheduled_at)}</p>
                  {m.cost && <p className="text-[#5A6A5A] text-xs">{m.currency} {m.cost}</p>}
                  {m.provider_name && <p className="text-[#5A6A5A] text-xs">{m.provider_name}</p>}
                </div>
                {m.notes && <p className="text-[#5A6A5A] text-xs mt-1">{m.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === "edit" && (
        <EditAssetModal
          asset={asset}
          categories={categories}
          onSaved={setAsset}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "delete" && (
        <DeleteAssetModal
          assetName={asset.name}
          onConfirm={handleDelete}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "upload" && (
        <UploadDocumentModal
          assetId={id}
          onUploaded={(doc) => setDocuments((prev) => [doc, ...prev])}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "maintenance" && (
        <CreateMaintenanceModal
          assetId={id}
          onCreated={(r) => setMaintenance((prev) => [r, ...prev])}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
