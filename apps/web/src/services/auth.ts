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

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    preferred_language: string;
    timezone: string;
  };
  access: string;
  refresh: string;
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

  me: async () => {
    const response = await apiClient.get("/auth/me/");
    return response.data;
  },

  refreshToken: async (refresh: string) => {
    const response = await apiClient.post("/auth/refresh/", { refresh });
    return response.data;
  },
};
