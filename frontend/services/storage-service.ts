import { api } from "./api";
import type {
  StorageBrowseResponse,
  StorageStats,
  SuccessResponse,
} from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:6007";

export const storageService = {
  browse: async (path?: string): Promise<StorageBrowseResponse> => {
    const res = await api.get<StorageBrowseResponse>("/api/storage/browse", {
      params: path ? { path } : undefined,
    });
    return res.data;
  },

  stats: async (): Promise<StorageStats> => {
    const res = await api.get<StorageStats>("/api/storage/stats");
    return res.data;
  },

  deleteFile: async (path: string): Promise<SuccessResponse> => {
    const res = await api.post<SuccessResponse>("/api/storage/delete", { path });
    return res.data;
  },

  getVideoUrl: (filename: string, subfolder?: string): string => {
    const params = new URLSearchParams({ filename });
    if (subfolder) params.set("subfolder", subfolder);
    return `${API_BASE_URL}/api/videos?${params.toString()}`;
  },
};
