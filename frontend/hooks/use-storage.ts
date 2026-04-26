"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storageService } from "@/services/storage-service";
import toast from "react-hot-toast";

export function useStorageBrowse(path?: string) {
  return useQuery({
    queryKey: ["storage", "browse", path],
    queryFn: () => storageService.browse(path),
  });
}

export function useStorageStats() {
  return useQuery({
    queryKey: ["storage", "stats"],
    queryFn: storageService.stats,
    refetchInterval: 30000,
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (path: string) => storageService.deleteFile(path),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["storage"] });
      toast.success("File deleted");
    },
    onError: () => toast.error("Failed to delete file"),
  });
}
