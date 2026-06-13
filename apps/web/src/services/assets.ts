import apiClient from "@/lib/api/axios";
import type {
  Asset,
  AssetCategory,
  AssetDocument,
  AssetStatus,
  MaintenanceRecord,
  MaintenanceType,
  MaintenanceStatus,
  DocumentType,
} from "@/types";

export interface CreateAssetPayload {
  name: string;
  household_node: string;
  status?: AssetStatus;
  description?: string;
  category?: number | null;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string | null;
  purchase_price?: string | null;
  warranty_expiry?: string | null;
  location_in_home?: string;
}

export type UpdateAssetPayload = Partial<CreateAssetPayload>;

export interface CreateMaintenancePayload {
  title: string;
  type: MaintenanceType;
  status?: MaintenanceStatus;
  scheduled_at: string;
  completed_at?: string | null;
  cost?: string | null;
  currency?: string;
  provider_name?: string;
  notes?: string;
  documents?: string[];
}

export type UpdateMaintenancePayload = Partial<CreateMaintenancePayload>;

export interface UploadDocumentPayload {
  name: string;
  type: DocumentType;
  file: File;
}

export const assetService = {
  listCategories: async (): Promise<AssetCategory[]> => {
    const response = await apiClient.get("/assets/categories/");
    return response.data;
  },

  list: async (householdId?: string): Promise<Asset[]> => {
    const params = householdId ? { household: householdId } : {};
    const response = await apiClient.get("/assets/", { params });
    return response.data;
  },

  create: async (payload: CreateAssetPayload): Promise<Asset> => {
    const response = await apiClient.post("/assets/", payload);
    return response.data;
  },

  getById: async (id: string): Promise<Asset> => {
    const response = await apiClient.get(`/assets/${id}/`);
    return response.data;
  },

  update: async (id: string, payload: UpdateAssetPayload): Promise<Asset> => {
    const response = await apiClient.patch(`/assets/${id}/`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/assets/${id}/`);
  },

  listDocuments: async (assetId: string): Promise<AssetDocument[]> => {
    const response = await apiClient.get(`/assets/${assetId}/documents/`);
    return response.data;
  },

  uploadDocument: async (assetId: string, payload: UploadDocumentPayload): Promise<AssetDocument> => {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("type", payload.type);
    formData.append("file", payload.file);
    const response = await apiClient.post(`/assets/${assetId}/documents/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  listMaintenance: async (assetId: string): Promise<MaintenanceRecord[]> => {
    const response = await apiClient.get(`/assets/${assetId}/maintenance/`);
    return response.data;
  },

  createMaintenance: async (assetId: string, payload: CreateMaintenancePayload): Promise<MaintenanceRecord> => {
    const data = { ...payload, asset: assetId };
    const response = await apiClient.post(`/assets/${assetId}/maintenance/`, data);
    return response.data;
  },

  updateMaintenance: async (maintenanceId: string, payload: UpdateMaintenancePayload): Promise<MaintenanceRecord> => {
    const response = await apiClient.patch(`/assets/maintenance/${maintenanceId}/`, payload);
    return response.data;
  },
};
