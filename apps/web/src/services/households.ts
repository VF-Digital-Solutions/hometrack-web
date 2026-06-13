import apiClient from "@/lib/api/axios";
import type {
  HouseholdNode,
  HouseholdMembership,
  HouseholdInvitation,
  HouseholdType,
  MemberRole,
} from "@/types";

export interface CreateHouseholdPayload {
  name: string;
  description?: string;
  type: HouseholdType;
}

export interface UpdateHouseholdPayload {
  name?: string;
  description?: string;
  type?: HouseholdType;
}

export interface InvitePayload {
  email: string;
  role: MemberRole;
}

export const householdService = {
  list: async (): Promise<HouseholdNode[]> => {
    const response = await apiClient.get("/households/");
    return response.data;
  },

  create: async (payload: CreateHouseholdPayload): Promise<HouseholdNode> => {
    const response = await apiClient.post("/households/", payload);
    return response.data;
  },

  getById: async (id: string): Promise<HouseholdNode> => {
    const response = await apiClient.get(`/households/${id}/`);
    return response.data;
  },

  update: async (id: string, payload: UpdateHouseholdPayload): Promise<HouseholdNode> => {
    const response = await apiClient.patch(`/households/${id}/`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/households/${id}/`);
  },

  listMembers: async (id: string): Promise<HouseholdMembership[]> => {
    const response = await apiClient.get(`/households/${id}/members/`);
    return response.data;
  },

  invite: async (id: string, payload: InvitePayload): Promise<HouseholdInvitation> => {
    const response = await apiClient.post(`/households/${id}/invite/`, payload);
    return response.data;
  },
};
