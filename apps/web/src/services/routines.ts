import apiClient from "@/lib/api/axios";
import type {
  Habit,
  HabitStreak,
  HabitLogStatus,
  HouseholdRoutine,
  HouseholdRoutineOccurrence,
} from "@/types";

export interface CreateHabitPayload {
  name: string;
  category?: string;
  frequency_type?: string;
  frequency_config?: Record<string, unknown>;
  visibility?: string;
  start_date: string;
  description?: string;
  icon?: string;
  color?: string;
  target_value?: string | null;
  target_unit?: string;
  reminder_time?: string | null;
  household_node?: string | null;
}

export type UpdateHabitPayload = Partial<CreateHabitPayload>;

export interface LogHabitPayload {
  logged_at: string;
  status: HabitLogStatus;
  value?: string | null;
  notes?: string;
}

export interface CreateRoutinePayload {
  household_node: string;
  title: string;
  category?: string;
  recurrence_type?: string;
  recurrence_config?: Record<string, unknown>;
  description?: string;
  estimated_duration_minutes?: number | null;
  is_rotative?: boolean;
  assignees?: string[];
  linked_asset?: string | null;
}

export type UpdateRoutinePayload = Partial<CreateRoutinePayload>;

export const routineService = {
  listHabits: async (): Promise<Habit[]> => {
    const response = await apiClient.get("/routines/habits/");
    return response.data;
  },

  createHabit: async (payload: CreateHabitPayload): Promise<Habit> => {
    const response = await apiClient.post("/routines/habits/", payload);
    return response.data;
  },

  updateHabit: async (id: string, payload: UpdateHabitPayload): Promise<Habit> => {
    const response = await apiClient.patch(`/routines/habits/${id}/`, payload);
    return response.data;
  },

  deleteHabit: async (id: string): Promise<void> => {
    await apiClient.delete(`/routines/habits/${id}/`);
  },

  logHabit: async (id: string, payload: LogHabitPayload): Promise<void> => {
    await apiClient.post(`/routines/habits/${id}/log/`, payload);
  },

  getStreak: async (id: string): Promise<HabitStreak> => {
    const response = await apiClient.get(`/routines/habits/${id}/streak/`);
    return response.data;
  },

  listRoutines: async (householdId?: string): Promise<HouseholdRoutine[]> => {
    const params = householdId ? { household: householdId } : {};
    const response = await apiClient.get("/routines/household/", { params });
    return response.data;
  },

  createRoutine: async (payload: CreateRoutinePayload): Promise<HouseholdRoutine> => {
    const response = await apiClient.post("/routines/household/", payload);
    return response.data;
  },

  updateRoutine: async (id: string, payload: UpdateRoutinePayload): Promise<HouseholdRoutine> => {
    const response = await apiClient.patch(`/routines/household/${id}/`, payload);
    return response.data;
  },

  deleteRoutine: async (id: string): Promise<void> => {
    await apiClient.delete(`/routines/household/${id}/`);
  },

  listOccurrences: async (routineId: string): Promise<HouseholdRoutineOccurrence[]> => {
    const response = await apiClient.get(`/routines/household/${routineId}/occurrences/`);
    return response.data;
  },

  completeOccurrence: async (occurrenceId: string, notes?: string): Promise<HouseholdRoutineOccurrence> => {
    const response = await apiClient.post(`/routines/occurrences/${occurrenceId}/complete/`, { notes: notes ?? "" });
    return response.data;
  },
};
