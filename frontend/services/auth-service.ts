import { api } from "./api";
import type { LoginRequest, LoginResponse, SessionResponse } from "@/types/auth";

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>("/api/auth/login", data);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/api/auth/logout");
  },

  validateSession: async (): Promise<SessionResponse> => {
    const res = await api.get<SessionResponse>("/api/auth/session");
    return res.data;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await api.put("/api/auth/password", {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },
};
