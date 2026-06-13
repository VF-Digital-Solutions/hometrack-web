import apiClient from "@/lib/api/axios";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  avatar_url: string | null;
  preferred_language: string;
  timezone: string;
}

export interface AuthResponse {
  user: AuthUser;
  access: string;
  refresh: string;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  username?: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  preferred_language?: string;
  timezone?: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/login/", credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/register/", credentials);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post("/auth/logout/", { refresh: refreshToken });
  },

  me: async (): Promise<AuthUser> => {
    const response = await apiClient.get("/auth/me/");
    return response.data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<AuthUser> => {
    const response = await apiClient.patch("/auth/me/", payload);
    return response.data;
  },

  refreshToken: async (refresh: string) => {
    const response = await apiClient.post("/auth/refresh/", { refresh });
    return response.data;
  },
};
