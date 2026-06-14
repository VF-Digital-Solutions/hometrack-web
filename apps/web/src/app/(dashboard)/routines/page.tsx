"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import type {
  Habit,
  HabitStreak,
  HabitCategory,
  HabitFrequency,
  HouseholdRoutine,
  HouseholdRoutineOccurrence,
  HouseholdNode,
  OccurrenceStatus,
} from "@/types";
import { routineService } from "@/services/routines";
import { householdService } from "@/services/households";

// ── Label maps ────────────────────────────────────────────────────────────────

const HABIT_CATEGORY_LABELS: Record<HabitCategory, string> = {
  HEALTH: "Salud",
  FITNESS: "Ejercicio",
  LEARNING: "Aprendizaje",
  HOME: "Hogar",
  FINANCE: "Finanzas",
  CUSTOM: "Personalizado",
};

const FREQ_LABELS: Record<HabitFrequency, string> = {
  DAILY: "Diario",
  WEEKLY: "Semanal",
  CUSTOM: "Personalizado",
};

const OCCURRENCE_STATUS_LABELS: Record<OccurrenceStatus, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
  SKIPPED: "Omitido",
};

const OCCURRENCE_STATUS_STYLES: Record<OccurrenceStatus, string> = {
  PENDING: "text-amber-400 bg-amber-900/10 border-amber-800/40",
  IN_PROGRESS: "text-blue-400 bg-blue-900/10 border-blue-800/40",
  COMPLETED: "text-green-400 bg-green-900/10 border-green-800/40",
  SKIPPED: "text-[#5A6A5A] bg-[#1A1A1A] border-[#2A2A2A]",
};

function StatusBadge({ status }: { status: OccurrenceStatus }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${OCCURRENCE_STATUS_STYLES[status]}`}>
      {OCCURRENCE_STATUS_LABELS[status]}
    </span>
  );
}

// ── Habits tab ────────────────────────────────────────────────────────────────

const createHabitSchema = z
  .object({
    name: z.string().min(1, "Requerido"),
    category: z.enum(["HEALTH", "FITNESS", "LEARNING", "HOME", "FINANCE", "CUSTOM"]),
    custom_category_label: z.string().optional(),
    frequency_type: z.enum(["DAILY", "WEEKLY", "CUSTOM"]),
    frequency_interval_days: z.string().optional(),
    visibility: z.enum(["PRIVATE", "HOUSEHOLD"]),
    start_date: z.string().min(1, "Requerido"),
    description: z.string().optional(),
  })
  .refine(
    (d) => d.category !== "CUSTOM" || (d.custom_category_label ?? "").trim().length > 0,
    { message: "Escribe el nombre de la categoría", path: ["custom_category_label"] }
  )
  .refine(
    (d) => d.frequency_type !== "CUSTOM" || (Number(d.frequency_interval_days) >= 1),
    { message: "Indica cada cuántos días", path: ["frequency_interval_days"] }
  );

type CreateHabitForm = z.infer<typeof createHabitSchema>;

const inputCls =
  "w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors";

function CreateHabitModal({
  onCreated,
  onClose,
}: {
  onCreated: (h: Habit) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateHabitForm>({
    resolver: zodResolver(createHabitSchema),
    defaultValues: {
      category: "CUSTOM",
      frequency_type: "DAILY",
      visibility: "PRIVATE",
      start_date: today,
    },
  });

  const selectedCategory = useWatch({ control, name: "category" });
  const selectedFrequency = useWatch({ control, name: "frequency_type" });

  const onSubmit = async (data: CreateHabitForm) => {
    setLoading(true);
    setError(null);
    try {
      const frequency_config: Record<string, unknown> = {};
      if (data.category === "CUSTOM" && data.custom_category_label) {
        frequency_config.category_label = data.custom_category_label.trim();
      }
      if (data.frequency_type === "CUSTOM" && data.frequency_interval_days) {
        frequency_config.interval_days = Number(data.frequency_interval_days);
      }
      const created = await routineService.createHabit({
        name: data.name,
        category: data.category,
        frequency_type: data.frequency_type,
        visibility: data.visibility,
        start_date: data.start_date,
        description: data.description,
        frequency_config,
      });
      onCreated(created);
      onClose();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Error al crear el hábito.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-[#EAE6DD] font-semibold mb-5">Nuevo hábito</h2>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Nombre *</label>
            <input
              {...register("name")}
              type="text"
              placeholder="Ej. Leer 20 minutos"
              className={inputCls}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Categoría</label>
            <select {...register("category")} className={inputCls}>
              {Object.entries(HABIT_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            {selectedCategory === "CUSTOM" && (
              <div className="mt-2">
                <input
                  {...register("custom_category_label")}
                  type="text"
                  placeholder="Nombre de tu categoría (ej. Meditación)"
                  className={inputCls}
                  autoFocus
                />
                {errors.custom_category_label && (
                  <p className="text-red-400 text-xs mt-1">{errors.custom_category_label.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Frecuencia */}
          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Frecuencia</label>
            <select {...register("frequency_type")} className={inputCls}>
              <option value="DAILY">Diario</option>
              <option value="WEEKLY">Semanal</option>
              <option value="CUSTOM">Personalizado</option>
            </select>
            {selectedFrequency === "CUSTOM" && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[#5A6A5A] text-sm shrink-0">Cada</span>
                <input
                  {...register("frequency_interval_days")}
                  type="number"
                  min="1"
                  placeholder="N"
                  className="w-20 bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors text-center"
                />
                <span className="text-[#5A6A5A] text-sm shrink-0">días</span>
                {errors.frequency_interval_days && (
                  <p className="text-red-400 text-xs">{errors.frequency_interval_days.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Visibilidad</label>
              <select {...register("visibility")} className={inputCls}>
                <option value="PRIVATE">Privado</option>
                <option value="HOUSEHOLD">Hogar</option>
              </select>
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Inicio *</label>
              <input
                {...register("start_date")}
                type="date"
                className={"appearance-none " + inputCls}
              />
              {errors.start_date && <p className="text-red-400 text-xs mt-1">{errors.start_date.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Descripción</label>
            <textarea
              {...register("description")}
              rows={2}
              placeholder="Descripción opcional"
              className={inputCls + " resize-none"}
            />
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
              className="flex-1 px-4 py-2 text-sm text-[#0D0D0D] bg-[#C8A96B] rounded-md hover:bg-[#b8995b] transition-colors font-medium disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear hábito"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const TODAY = new Date().toISOString().split("T")[0];

function loggedTodayKey(habitId: string) {
  return `ht_habit_logged_${habitId}_${TODAY}`;
}

function HabitCard({
  habit,
  streak,
  onLogged,
}: {
  habit: Habit;
  streak: HabitStreak | null;
  onLogged: () => void;
}) {
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [loggedToday, setLoggedToday] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(loggedTodayKey(habit.id)) === "1";
  });

  const handleLog = async () => {
    setLogging(true);
    setLogError(null);
    try {
      await routineService.logHabit(habit.id, { logged_at: TODAY, status: "COMPLETED" });
      localStorage.setItem(loggedTodayKey(habit.id), "1");
      setLoggedToday(true);
      onLogged();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 400) {
        localStorage.setItem(loggedTodayKey(habit.id), "1");
        setLoggedToday(true);
      } else {
        setLogError("Error al registrar.");
      }
    } finally {
      setLogging(false);
    }
  };

  const startFormatted = new Date(habit.start_date + "T00:00:00").toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const cfg = habit.frequency_config as Record<string, unknown>;

  const categoryLabel =
    habit.category === "CUSTOM" && typeof cfg.category_label === "string"
      ? cfg.category_label
      : HABIT_CATEGORY_LABELS[habit.category];

  const freqLabel =
    habit.frequency_type === "CUSTOM" && typeof cfg.interval_days === "number"
      ? `Cada ${cfg.interval_days} días`
      : FREQ_LABELS[habit.frequency_type];

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#C8A96B] font-semibold text-sm shrink-0">
            {habit.icon || habit.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-[#EAE6DD] font-medium text-sm leading-snug truncate">{habit.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-xs px-1.5 py-0.5 rounded bg-[#1A1A1A] border border-[#2A2A2A] text-[#5A6A5A]">
                {categoryLabel}
              </span>
              <span className="text-xs text-[#5A6A5A]">{freqLabel}</span>
            </div>
          </div>
        </div>
        {loggedToday && (
          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full border text-green-400 bg-green-900/10 border-green-800/40">
            ✓ Hoy
          </span>
        )}
      </div>

      {/* Description */}
      {habit.description && (
        <p className="text-[#5A6A5A] text-xs leading-relaxed line-clamp-2">{habit.description}</p>
      )}

      {/* Streak stats */}
      {streak ? (
        <div className="grid grid-cols-3 gap-2 bg-[#0D0D0D] rounded-md p-3 border border-[#1E1E1E]">
          <div className="text-center">
            <p className="text-[#C8A96B] font-semibold text-base leading-none">
              {streak.current_streak > 0 ? `🔥 ${streak.current_streak}` : "—"}
            </p>
            <p className="text-[#5A6A5A] text-[10px] mt-1">Racha actual</p>
          </div>
          <div className="text-center border-x border-[#2A2A2A]">
            <p className="text-[#EAE6DD] font-semibold text-base leading-none">{streak.longest_streak}</p>
            <p className="text-[#5A6A5A] text-[10px] mt-1">Mejor racha</p>
          </div>
          <div className="text-center">
            <p className="text-[#EAE6DD] font-semibold text-base leading-none">{streak.total_completions}</p>
            <p className="text-[#5A6A5A] text-[10px] mt-1">Total</p>
          </div>
        </div>
      ) : (
        <div className="h-[52px] bg-[#0D0D0D] rounded-md border border-[#1E1E1E] flex items-center justify-center">
          <div className="w-4 h-4 border border-[#2A2A2A] border-t-[#C8A96B] rounded-full animate-spin" />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-[#5A6A5A]">
        <span>Desde {startFormatted}</span>
        {habit.visibility === "HOUSEHOLD" && (
          <span className="px-1.5 py-0.5 rounded bg-[#1A1A1A] border border-[#2A2A2A]">Compartido</span>
        )}
      </div>

      {logError && <p className="text-red-400 text-xs">{logError}</p>}

      <button
        onClick={handleLog}
        disabled={logging || loggedToday}
        className={`w-full px-3 py-2 text-xs rounded-md transition-colors font-medium ${
          loggedToday
            ? "text-green-400 bg-green-900/10 border border-green-800/40 cursor-default"
            : "text-[#0D0D0D] bg-[#C8A96B] hover:bg-[#b8995b] disabled:opacity-50 disabled:cursor-not-allowed"
        }`}
      >
        {loggedToday ? "Registrado hoy" : logging ? "Registrando..." : "Registrar hoy"}
      </button>
    </div>
  );
}

// ── Routines tab ──────────────────────────────────────────────────────────────

const ROUTINE_CATEGORY_LABELS: Record<string, string> = {
  CLEANING: "Limpieza",
  MAINTENANCE: "Mantenimiento",
  SHOPPING: "Compras",
  COOKING: "Cocina",
  CUSTOM: "Personalizado",
};

const RECURRENCE_LABELS: Record<string, string> = {
  ONCE: "Una vez",
  DAILY: "Diario",
  WEEKLY: "Semanal",
  MONTHLY: "Mensual",
  CUSTOM: "Personalizado",
};

const createRoutineSchema = z
  .object({
    household_node: z.string().min(1, "Requerido"),
    title: z.string().min(1, "Requerido"),
    category: z.string(),
    recurrence_type: z.string(),
    recurrence_interval_days: z.string().optional(),
    description: z.string().optional(),
    estimated_duration_minutes: z.string().optional(),
  })
  .refine(
    (d) => d.recurrence_type !== "CUSTOM" || Number(d.recurrence_interval_days) >= 1,
    { message: "Indica cada cuántos días", path: ["recurrence_interval_days"] }
  );

type CreateRoutineForm = z.infer<typeof createRoutineSchema>;

function CreateRoutineModal({
  households,
  onCreated,
  onClose,
}: {
  households: HouseholdNode[];
  onCreated: (r: HouseholdRoutine) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateRoutineForm>({
    resolver: zodResolver(createRoutineSchema),
    defaultValues: { category: "CUSTOM", recurrence_type: "WEEKLY" },
  });

  const selectedRecurrence = useWatch({ control, name: "recurrence_type" });

  const onSubmit = async (data: CreateRoutineForm) => {
    setLoading(true);
    setError(null);
    try {
      const recurrence_config: Record<string, unknown> =
        data.recurrence_type === "CUSTOM" && data.recurrence_interval_days
          ? { interval_days: Number(data.recurrence_interval_days) }
          : {};
      const payload = {
        household_node: data.household_node,
        title: data.title,
        category: data.category,
        recurrence_type: data.recurrence_type,
        description: data.description,
        estimated_duration_minutes: data.estimated_duration_minutes
          ? Number(data.estimated_duration_minutes)
          : null,
        recurrence_config,
      };
      const created = await routineService.createRoutine(payload);
      onCreated(created);
      onClose();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Error al crear la rutina.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-[#EAE6DD] font-semibold mb-5">Nueva rutina del hogar</h2>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Título *</label>
            <input
              {...register("title")}
              type="text"
              placeholder="Ej. Limpiar cocina"
              className={inputCls}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Hogar *</label>
            <select {...register("household_node")} className={inputCls}>
              <option value="">Seleccionar hogar</option>
              {households.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
            {errors.household_node && <p className="text-red-400 text-xs mt-1">{errors.household_node.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Categoría</label>
              <select {...register("category")} className={inputCls}>
                {Object.entries(ROUTINE_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Recurrencia</label>
              <select {...register("recurrence_type")} className={inputCls}>
                {Object.entries(RECURRENCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedRecurrence === "CUSTOM" && (
            <div>
              <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Período personalizado</label>
              <div className="flex items-center gap-2">
                <span className="text-[#5A6A5A] text-sm shrink-0">Cada</span>
                <input
                  {...register("recurrence_interval_days")}
                  type="number"
                  min="1"
                  placeholder="N"
                  className="w-20 bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors text-center"
                />
                <span className="text-[#5A6A5A] text-sm shrink-0">días</span>
                {errors.recurrence_interval_days && (
                  <p className="text-red-400 text-xs">{errors.recurrence_interval_days.message}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Duración estimada (min)</label>
            <input
              {...register("estimated_duration_minutes")}
              type="number"
              min="1"
              placeholder="Ej. 30"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5">Descripción</label>
            <textarea
              {...register("description")}
              rows={2}
              placeholder="Descripción opcional"
              className={inputCls + " resize-none"}
            />
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
              className="flex-1 px-4 py-2 text-sm text-[#0D0D0D] bg-[#C8A96B] rounded-md hover:bg-[#b8995b] transition-colors font-medium disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear rutina"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OccurrencesModal({
  routine,
  onClose,
}: {
  routine: HouseholdRoutine;
  onClose: () => void;
}) {
  const [occurrences, setOccurrences] = useState<HouseholdRoutineOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    routineService.listOccurrences(routine.id)
      .then(setOccurrences)
      .finally(() => setLoading(false));
  }, [routine.id]);

  const handleComplete = async (occ: HouseholdRoutineOccurrence) => {
    setCompleting(occ.id);
    try {
      const updated = await routineService.completeOccurrence(occ.id);
      setOccurrences((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[#EAE6DD] font-semibold">{routine.title}</h2>
          <button
            onClick={onClose}
            className="text-[#5A6A5A] hover:text-[#EAE6DD] text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-5 h-5 border-2 border-[#C8A96B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : occurrences.length === 0 ? (
            <p className="text-[#5A6A5A] text-sm text-center py-12">Sin ocurrencias registradas</p>
          ) : (
            <ul className="space-y-3">
              {occurrences.map((occ) => (
                <li
                  key={occ.id}
                  className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-[#EAE6DD] text-sm">
                      {new Date(occ.due_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {occ.notes && <p className="text-[#5A6A5A] text-xs mt-0.5">{occ.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={occ.status} />
                    {(occ.status === "PENDING" || occ.status === "IN_PROGRESS") && (
                      <button
                        onClick={() => handleComplete(occ)}
                        disabled={completing === occ.id}
                        className="text-xs px-2 py-1 text-[#0D0D0D] bg-[#C8A96B] rounded hover:bg-[#b8995b] transition-colors font-medium disabled:opacity-50"
                      >
                        {completing === occ.id ? "..." : "Completar"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function RoutineCard({
  routine,
  onViewOccurrences,
}: {
  routine: HouseholdRoutine;
  onViewOccurrences: (r: HouseholdRoutine) => void;
}) {
  const rcfg = routine.recurrence_config as Record<string, unknown>;
  const recurrenceLabel =
    routine.recurrence_type === "CUSTOM" && typeof rcfg.interval_days === "number"
      ? `Cada ${rcfg.interval_days} días`
      : (RECURRENCE_LABELS[routine.recurrence_type] ?? routine.recurrence_type);

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#C8A96B] font-semibold text-sm shrink-0">
          {routine.title.charAt(0).toUpperCase()}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full border text-[#5A6A5A] bg-[#1A1A1A] border-[#2A2A2A]">
          {recurrenceLabel}
        </span>
      </div>

      <div>
        <h3 className="text-[#EAE6DD] font-medium text-sm mb-1">{routine.title}</h3>
        <p className="text-[#5A6A5A] text-xs">{ROUTINE_CATEGORY_LABELS[routine.category] ?? routine.category}</p>
        {routine.description && (
          <p className="text-[#5A6A5A] text-xs mt-1 line-clamp-2">{routine.description}</p>
        )}
        {routine.estimated_duration_minutes && (
          <p className="text-[#5A6A5A] text-xs mt-0.5">{routine.estimated_duration_minutes} min</p>
        )}
      </div>

      <button
        onClick={() => onViewOccurrences(routine)}
        className="mt-auto w-full px-3 py-1.5 text-xs rounded-md border border-[#2A2A2A] text-[#5A6A5A] hover:text-[#EAE6DD] hover:border-[#5A6A5A] transition-colors"
      >
        Ver ocurrencias
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = "habits" | "routines";

export default function RoutinesPage() {
  const [tab, setTab] = useState<Tab>("habits");

  // Habits state
  const [habits, setHabits] = useState<Habit[]>([]);
  const [streaks, setStreaks] = useState<Record<string, HabitStreak>>({});
  const [habitsLoading, setHabitsLoading] = useState(true);
  const [habitsError, setHabitsError] = useState<string | null>(null);
  const [showHabitForm, setShowHabitForm] = useState(false);

  // Routines state
  const [routines, setRoutines] = useState<HouseholdRoutine[]>([]);
  const [households, setHouseholds] = useState<HouseholdNode[]>([]);
  const [selectedHousehold, setSelectedHousehold] = useState("");
  const [routinesLoading, setRoutinesLoading] = useState(true);
  const [routinesError, setRoutinesError] = useState<string | null>(null);
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<HouseholdRoutine | null>(null);

  const loadStreaks = useCallback(async (habitList: Habit[]) => {
    const results = await Promise.allSettled(
      habitList.map((h) => routineService.getStreak(h.id).then((s) => ({ id: h.id, streak: s })))
    );
    const map: Record<string, HabitStreak> = {};
    for (const r of results) {
      if (r.status === "fulfilled") {
        map[r.value.id] = r.value.streak;
      }
    }
    setStreaks(map);
  }, []);

  useEffect(() => {
    routineService.listHabits()
      .then((list) => {
        setHabits(list);
        loadStreaks(list);
      })
      .catch(() => setHabitsError("No se pudieron cargar los hábitos."))
      .finally(() => setHabitsLoading(false));
  }, [loadStreaks]);

  useEffect(() => {
    Promise.all([routineService.listRoutines(), householdService.list()])
      .then(([r, h]) => {
        setRoutines(r);
        setHouseholds(h);
      })
      .catch(() => setRoutinesError("No se pudieron cargar las rutinas."))
      .finally(() => setRoutinesLoading(false));
  }, []);

  const handleRoutineFilter = async (householdId: string) => {
    setSelectedHousehold(householdId);
    setRoutinesLoading(true);
    setRoutinesError(null);
    try {
      const filtered = await routineService.listRoutines(householdId || undefined);
      setRoutines(filtered);
    } catch {
      setRoutinesError("Error al filtrar rutinas.");
    } finally {
      setRoutinesLoading(false);
    }
  };

  const handleHabitCreated = (h: Habit) => {
    setHabits((prev) => [h, ...prev]);
    routineService.getStreak(h.id).then((s) => {
      setStreaks((prev) => ({ ...prev, [h.id]: s }));
    }).catch(() => {});
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#EAE6DD]">Rutinas y hábitos</h2>
          <p className="text-[#5A6A5A] text-sm mt-1">Seguimiento de hábitos personales y rutinas del hogar</p>
        </div>
        <button
          onClick={() => (tab === "habits" ? setShowHabitForm(true) : setShowRoutineForm(true))}
          className="px-4 py-2 text-sm text-[#0D0D0D] bg-[#C8A96B] rounded-md hover:bg-[#b8995b] transition-colors font-medium"
        >
          {tab === "habits" ? "Nuevo hábito" : "Nueva rutina"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#2A2A2A]">
        {(["habits", "routines"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
              tab === t
                ? "text-[#C8A96B] border-[#C8A96B]"
                : "text-[#5A6A5A] border-transparent hover:text-[#EAE6DD]"
            }`}
          >
            {t === "habits" ? "Hábitos" : "Rutinas del hogar"}
          </button>
        ))}
      </div>

      {/* Habits tab */}
      {tab === "habits" && (
        <>
          {habitsLoading ? (
            <div className="flex justify-center py-24">
              <div className="w-6 h-6 border-2 border-[#C8A96B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : habitsError ? (
            <div className="flex flex-col items-center justify-center py-24">
              <p className="text-red-400 text-sm">{habitsError}</p>
            </div>
          ) : habits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-4">
                <span className="text-[#5A6A5A] text-xl">◇</span>
              </div>
              <p className="text-[#EAE6DD] text-sm font-medium mb-1">Sin hábitos</p>
              <p className="text-[#5A6A5A] text-xs">Crea tu primer hábito para empezar a registrarlo</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {habits.map((h) => (
                <HabitCard
                  key={h.id}
                  habit={h}
                  streak={streaks[h.id] ?? null}
                  onLogged={() => loadStreaks(habits)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Routines tab */}
      {tab === "routines" && (
        <>
          {households.length > 0 && (
            <div className="mb-6">
              <select
                value={selectedHousehold}
                onChange={(e) => handleRoutineFilter(e.target.value)}
                className="bg-[#111111] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors"
              >
                <option value="">Todos los hogares</option>
                {households.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          )}

          {routinesLoading ? (
            <div className="flex justify-center py-24">
              <div className="w-6 h-6 border-2 border-[#C8A96B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : routinesError ? (
            <div className="flex flex-col items-center justify-center py-24">
              <p className="text-red-400 text-sm">{routinesError}</p>
            </div>
          ) : routines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-4">
                <span className="text-[#5A6A5A] text-xl">↻</span>
              </div>
              <p className="text-[#EAE6DD] text-sm font-medium mb-1">Sin rutinas</p>
              <p className="text-[#5A6A5A] text-xs">Crea una rutina del hogar para organizarte</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {routines.map((r) => (
                <RoutineCard
                  key={r.id}
                  routine={r}
                  onViewOccurrences={setSelectedRoutine}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showHabitForm && (
        <CreateHabitModal
          onCreated={handleHabitCreated}
          onClose={() => setShowHabitForm(false)}
        />
      )}

      {showRoutineForm && (
        <CreateRoutineModal
          households={households}
          onCreated={(r) => setRoutines((prev) => [r, ...prev])}
          onClose={() => setShowRoutineForm(false)}
        />
      )}

      {selectedRoutine && (
        <OccurrencesModal
          routine={selectedRoutine}
          onClose={() => setSelectedRoutine(null)}
        />
      )}
    </div>
  );
}
