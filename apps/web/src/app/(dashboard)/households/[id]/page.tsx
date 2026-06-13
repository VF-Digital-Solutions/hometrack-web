"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import type { HouseholdNode, HouseholdMembership, HouseholdType, MemberRole } from "@/types";
import { householdService } from "@/services/households";
import { useAuthStore } from "@/store/auth";

const TYPE_LABELS: Record<HouseholdType, string> = {
  INDIVIDUAL: "Individual",
  FAMILY: "Familiar",
  COMMUNITY: "Comunidad",
};

const ROLE_STYLES: Record<MemberRole, string> = {
  OWNER: "text-[#C8A96B] border-[#C8A96B]/30 bg-[#C8A96B]/10",
  ADMIN: "text-[#EAE6DD] border-[#EAE6DD]/20 bg-[#EAE6DD]/5",
  MEMBER: "text-[#5A6A5A] border-[#5A6A5A]/30 bg-[#5A6A5A]/10",
  GUEST: "text-[#3A4A3A] border-[#3A4A3A]/30 bg-[#3A4A3A]/10",
};

const ROLE_LABELS: Record<MemberRole, string> = {
  OWNER: "Propietario",
  ADMIN: "Admin",
  MEMBER: "Miembro",
  GUEST: "Invitado",
};

function RoleBadge({ role }: { role: MemberRole }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_STYLES[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}

function MemberRow({ membership }: { membership: HouseholdMembership }) {
  const { user, role, joined_at, nickname } = membership;
  const fullName = `${user.first_name} ${user.last_name}`;
  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  const joinDate = new Date(joined_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#1A1A1A] last:border-0">
      <div className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#5A6A5A] text-xs font-medium shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#EAE6DD] text-sm font-medium truncate">
          {fullName}
          {nickname && <span className="text-[#5A6A5A] font-normal ml-1.5">({nickname})</span>}
        </p>
        <p className="text-[#5A6A5A] text-xs truncate">{user.email}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[#5A6A5A] text-xs hidden sm:block">{joinDate}</span>
        <RoleBadge role={role} />
      </div>
    </div>
  );
}

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["ADMIN", "MEMBER", "GUEST"]),
});

type InviteForm = z.infer<typeof inviteSchema>;

function InviteForm({
  householdId,
  onInvited,
}: {
  householdId: string;
  onInvited?: () => void;
}) {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "MEMBER" },
  });

  const onSubmit = async (data: InviteForm) => {
    setSuccess(null);
    setError(null);
    try {
      await householdService.invite(householdId, data);
      setSuccess(`Invitación enviada a ${data.email}`);
      reset();
      onInvited?.();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Error al enviar la invitación.");
      }
    }
  };

  return (
    <div className="space-y-4">
      {success && (
        <div className="bg-green-900/20 border border-green-800 text-green-400 text-sm px-4 py-3 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">
              Correo electrónico
            </label>
            <input
              {...register("email")}
              type="email"
              autoComplete="off"
              placeholder="usuario@ejemplo.com"
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">
              Rol
            </label>
            <select
              {...register("role")}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors"
            >
              <option value="MEMBER">Miembro</option>
              <option value="ADMIN">Admin</option>
              <option value="GUEST">Invitado</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm text-[#0D0D0D] bg-[#C8A96B] rounded-md hover:bg-[#b8995b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Enviando..." : "Enviar invitación"}
        </button>
      </form>
    </div>
  );
}

const editSchema = z.object({
  name: z.string().min(1, "Requerido"),
  description: z.string().optional(),
  type: z.enum(["INDIVIDUAL", "FAMILY", "COMMUNITY"]),
});

type EditForm = z.infer<typeof editSchema>;

function EditModal({
  household,
  onSaved,
  onClose,
}: {
  household: HouseholdNode;
  onSaved: (h: HouseholdNode) => void;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: household.name,
      description: household.description,
      type: household.type,
    },
  });

  const onSubmit = async (data: EditForm) => {
    setError(null);
    try {
      const updated = await householdService.update(household.id, data);
      onSaved(updated);
      onClose();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Error al guardar los cambios.");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-[#EAE6DD] font-semibold mb-5">Editar hogar</h2>

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
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors"
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
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors resize-none"
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
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm text-[#5A6A5A] border border-[#2A2A2A] rounded-md hover:text-[#EAE6DD] hover:border-[#5A6A5A] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm text-[#0D0D0D] bg-[#C8A96B] rounded-md hover:bg-[#b8995b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  householdId,
  name,
  onClose,
}: {
  householdId: string;
  name: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await householdService.remove(householdId);
      router.push("/households");
    } catch {
      setError("Error al eliminar el hogar.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-sm mx-4">
        <h2 className="text-[#EAE6DD] font-semibold mb-2">Eliminar hogar</h2>
        <p className="text-[#5A6A5A] text-sm mb-6">
          ¿Eliminar <span className="text-[#EAE6DD]">{name}</span>? Esta acción no se puede deshacer.
        </p>
        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm text-[#5A6A5A] border border-[#2A2A2A] rounded-md hover:text-[#EAE6DD] hover:border-[#5A6A5A] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm text-white bg-red-800/70 rounded-md hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HouseholdDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [household, setHousehold] = useState<HouseholdNode | null>(null);
  const [members, setMembers] = useState<HouseholdMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    Promise.all([householdService.getById(id), householdService.listMembers(id)])
      .then(([h, m]) => {
        setHousehold(h);
        setMembers(m);
      })
      .catch((err) => {
        if (isAxiosError(err) && err.response?.status === 404) {
          router.push("/households");
        }
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const currentUserId = useAuthStore.getState().user?.id;
  const currentUserRole: MemberRole =
    members.find((m) => m.user.id === currentUserId)?.role ?? "MEMBER";
  const canInvite = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-6 h-6 border-2 border-[#C8A96B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!household) return null;

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push("/households")}
        className="text-[#5A6A5A] text-sm hover:text-[#C8A96B] transition-colors mb-6 flex items-center gap-1.5"
      >
        ← Hogares
      </button>

      {/* Header */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#C8A96B] font-semibold text-lg shrink-0">
              {household.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-[#EAE6DD] text-xl font-semibold">{household.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full border border-[#2A2A2A] text-[#5A6A5A]">
                  {TYPE_LABELS[household.type]}
                </span>
              </div>
              <p className="text-[#5A6A5A] text-sm">{household.description}</p>
              {!!household.address?.city && (
                <p className="text-[#5A6A5A] text-xs mt-2">
                  {String(household.address.city)}, {String(household.address.country ?? "")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowEdit(true)}
              className="px-3 py-1.5 text-xs text-[#5A6A5A] border border-[#2A2A2A] rounded-md hover:text-[#EAE6DD] hover:border-[#5A6A5A] transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="px-3 py-1.5 text-xs text-red-500/60 border border-red-900/30 rounded-md hover:text-red-400 hover:border-red-800/50 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#EAE6DD] font-medium text-sm uppercase tracking-wider">
            Miembros
          </h3>
          <span className="text-[#5A6A5A] text-xs">{members.length} miembros</span>
        </div>
        <div>
          {members.map((m) => (
            <MemberRow key={m.id} membership={m} />
          ))}
        </div>
      </div>

      {/* Invite */}
      {canInvite && (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6">
          <h3 className="text-[#EAE6DD] font-medium text-sm uppercase tracking-wider mb-4">
            Invitar miembro
          </h3>
          <InviteForm householdId={id} />
        </div>
      )}

      {showEdit && (
        <EditModal
          household={household}
          onSaved={(updated) => setHousehold(updated)}
          onClose={() => setShowEdit(false)}
        />
      )}
      {showDelete && (
        <DeleteConfirmModal
          householdId={id}
          name={household.name}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
