"use client";

import { useAuthStore } from "@/store/auth";

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-[#EAE6DD]">
          Bienvenido, {user?.first_name}
        </h2>
        <p className="text-[#5A6A5A] text-sm mt-1">
          Tu resumen de hoy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Activos", value: "—", description: "Total registrados" },
          { label: "Balance", value: "—", description: "Cuentas activas" },
          { label: "Hábitos", value: "—", description: "Completados hoy" },
          { label: "Reservas", value: "—", description: "Próximas 7 días" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-5"
          >
            <p className="text-[#5A6A5A] text-xs uppercase tracking-wider mb-2">
              {card.label}
            </p>
            <p className="text-2xl font-semibold text-[#C8A96B]">
              {card.value}
            </p>
            <p className="text-[#5A6A5A] text-xs mt-1">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

