"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "@/services/settings-service";
import type { UserSettings } from "@/types/settings";
import toast from "react-hot-toast";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: settingsService.get,
    staleTime: 60000,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserSettings>) => settingsService.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });
}

export function useCookies() {
  return useQuery({
    queryKey: ["settings", "cookies"],
    queryFn: settingsService.getCookies,
  });
}

export function useUpdateCookies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, string>) => settingsService.updateCookies(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings", "cookies"] });
      toast.success("Cookies saved");
    },
    onError: () => toast.error("Failed to save cookies"),
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: ["settings", "accounts"],
    queryFn: settingsService.getAccounts,
  });
}

export function useUpdateAccounts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => settingsService.updateAccounts(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings", "accounts"] });
      toast.success("Accounts saved");
    },
    onError: () => toast.error("Failed to save accounts"),
  });
}
