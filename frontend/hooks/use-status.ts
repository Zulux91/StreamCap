"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { AppStatus, UpdateCheckResponse } from "@/types/api";
import toast from "react-hot-toast";

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

export function useRestartLiveChecker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<AppStatus["live_checker"]>("/api/live-checker/restart");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["status"] });
      toast.success("Live checker restarted");
    },
    onError: () => toast.error("Failed to restart live checker"),
  });
}
