import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HouseholdNode } from "@/types";

interface HouseholdState {
  currentHousehold: HouseholdNode | null;
  households: HouseholdNode[];
  setCurrentHousehold: (household: HouseholdNode) => void;
  setHouseholds: (households: HouseholdNode[]) => void;
  clearHousehold: () => void;
}

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set) => ({
      currentHousehold: null,
      households: [],

      setCurrentHousehold: (household) => set({ currentHousehold: household }),

      setHouseholds: (households) => set({ households }),

      clearHousehold: () =>
        set({
          currentHousehold: null,
          households: [],
        }),
    }),
    {
      name: "hometrack-household",
    },
  ),
);
