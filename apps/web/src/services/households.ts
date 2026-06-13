import apiClient from "@/lib/api/axios";
import type { HouseholdNode, HouseholdType } from "@/types";

export interface CreateHouseholdPayload {
  name: string;
  description?: string;
  type: HouseholdType;
}

export const householdService = {
  create: async (payload: CreateHouseholdPayload): Promise<HouseholdNode> => {
    const response = await apiClient.post("/households/", payload);
    return response.data;
  },
};
