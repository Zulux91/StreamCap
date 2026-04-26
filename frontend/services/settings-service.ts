import { api } from "./api";
import type { UserSettings } from "@/types/settings";

export const settingsService = {
  get: async (): Promise<UserSettings> => {
    const res = await api.get<UserSettings>("/api/settings");
    return res.data;
  },

  update: async (data: Partial<UserSettings>): Promise<UserSettings> => {
    const res = await api.put<UserSettings>("/api/settings", data);
    return res.data;
  },

  getCookies: async (): Promise<Record<string, string>> => {
    const res = await api.get<Record<string, string>>("/api/settings/cookies");
    return res.data;
  },

  updateCookies: async (data: Record<string, string>): Promise<void> => {
    await api.put("/api/settings/cookies", data);
  },

  getAccounts: async (): Promise<Record<string, unknown>> => {
    const res = await api.get<Record<string, unknown>>("/api/settings/accounts");
    return res.data;
  },

  updateAccounts: async (data: Record<string, unknown>): Promise<void> => {
    await api.put("/api/settings/accounts", data);
  },

  getLanguages: async (): Promise<{ code: string; name: string }[]> => {
    const res = await api.get<{ languages: { code: string; name: string }[] }>(
      "/api/settings/languages"
    );
    return res.data.languages;
  },
};
