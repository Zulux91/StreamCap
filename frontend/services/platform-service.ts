import { api } from "./api";
import type { Platform, PlatformDetectResult } from "@/types/platform";

export const platformService = {
  list: async (): Promise<Platform[]> => {
    const res = await api.get<{ platforms: Platform[] }>("/api/platforms");
    return res.data.platforms;
  },

  detect: async (url: string): Promise<PlatformDetectResult> => {
    const res = await api.get<PlatformDetectResult>("/api/platforms/detect", {
      params: { url },
    });
    return res.data;
  },
};
