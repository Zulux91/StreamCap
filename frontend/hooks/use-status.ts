"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { AppStatus, UpdateCheckResponse } from "@/types/api";

export function useAppStatus() {
  return useQuery({
    queryKey: ["status"],
    queryFn: async () => {
      const res = await api.get<AppStatus>("/api/status");
      return res.data;
    },
    refetchInterval: 15000,
  });
}

export function useUpdateCheck() {
  return useQuery({
    queryKey: ["updates"],
    queryFn: async () => {
      const res = await api.get<UpdateCheckResponse>("/api/updates/check");
      return res.data;
    },
    staleTime: 300000,
  });
}
