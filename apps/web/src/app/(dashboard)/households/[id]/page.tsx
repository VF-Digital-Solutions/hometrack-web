"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { HouseholdNode, HouseholdMembership, HouseholdType, MemberRole } from "@/types";

const MOCK_HOUSEHOLD: HouseholdNode = {
  id: "1a2b3c4d-0000-0000-0000-000000000001",
  name: "Casa Principal",
  description: "Hogar familiar en la ciudad. Espacio compartido para gestionar activos, finanzas y rutinas del día a día.",
  type: "FAMILY",
  parent: null,
  avatar_url: null,
  address: { street: "Calle Mayor 12", city: "Madrid", country: "España" },
  settings: {},
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-03-20T08:30:00Z",
};

const MOCK_MEMBERS: HouseholdMembership[] = [
  {
    id: "m1",
    user: { id: "u1", email: "javier@example.com", username: "javier", first_name: "Javier", last_name: "García" },
    node: "1a2b3c4d-0000-0000-0000-000000000001",
    role: "OWNER",
    nickname: null,
    joined_at: "2024-01-15T10:00:00Z",
    left_at: null,
  },
  {
    id: "m2",
    user: { id: "u2", email: "laura@example.com", username: "laura", first_name: "Laura", last_name: "Martínez" },
    node: "1a2b3c4d-0000-0000-0000-000000000001",
    role: "ADMIN",
    nickname: "Lau",
    joined_at: "2024-01-20T09:00:00Z",
    left_at: null,
  },
  {
    id: "m3",
    user: { id: "u3", email: "carlos@example.com", username: "carlos", first_name: "Carlos", last_name: "López" },
    node: "1a2b3c4d-0000-0000-0000-000000000001",
    role: "MEMBER",
    nickname: null,
    joined_at: "2024-02-05T14:30:00Z",
    left_at: null,
  },
];

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

function InviteForm() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">
            Correo electrónico
          </label>
          <input
            type="email"
            placeholder="usuario@ejemplo.com"
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors"
          />
        </div>
        <div>
          <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">
            Rol
          </label>
          <select className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors">
            <option value="MEMBER">Miembro</option>
            <option value="ADMIN">Admin</option>
            <option value="GUEST">Invitado</option>
          </select>
        </div>
      </div>
      <button
        disabled
        className="px-4 py-2 text-sm text-[#0D0D0D] bg-[#C8A96B] rounded-md opacity-50 cursor-not-allowed font-medium"
      >
        Enviar invitación
      </button>
    </div>
  );
}

function EditModal({ household, onClose }: { household: HouseholdNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-[#EAE6DD] font-semibold mb-5">Editar hogar</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">
              Nombre
            </label>
            <input
              type="text"
              defaultValue={household.name}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">
              Descripción
            </label>
            <textarea
              rows={3}
              defaultValue={household.description}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">
              Tipo
            </label>
            <select
              defaultValue={household.type}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors"
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="FAMILY">Familiar</option>
              <option value="COMMUNITY">Comunidad</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-[#5A6A5A] border border-[#2A2A2A] rounded-md hover:text-[#EAE6DD] hover:border-[#5A6A5A] transition-colors"
          >
            Cancelar
          </button>
          <button
            disabled
            className="flex-1 px-4 py-2 text-sm text-[#0D0D0D] bg-[#C8A96B] rounded-md opacity-50 cursor-not-allowed font-medium"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-sm mx-4">
        <h2 className="text-[#EAE6DD] font-semibold mb-2">Eliminar hogar</h2>
        <p className="text-[#5A6A5A] text-sm mb-6">
          ¿Eliminar <span className="text-[#EAE6DD]">{name}</span>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-[#5A6A5A] border border-[#2A2A2A] rounded-md hover:text-[#EAE6DD] hover:border-[#5A6A5A] transition-colors"
          >
            Cancelar
          </button>
          <button
            disabled
            className="flex-1 px-4 py-2 text-sm text-white bg-red-800/50 rounded-md opacity-50 cursor-not-allowed font-medium"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HouseholdDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const household = MOCK_HOUSEHOLD;
  const members = MOCK_MEMBERS;
  const currentUserRole: MemberRole = "OWNER";
  const canInvite = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

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
          <InviteForm />
        </div>
      )}

      {showEdit && <EditModal household={household} onClose={() => setShowEdit(false)} />}
      {showDelete && <DeleteConfirmModal name={household.name} onClose={() => setShowDelete(false)} />}
    </div>
  );
}
