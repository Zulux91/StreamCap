"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recordingService } from "@/services/recording-service";
import type { CreateRecordingInput, UpdateRecordingInput } from "@/types/recording";
import toast from "react-hot-toast";

interface RecordingsFilter {
  status?: string;
  platform?: string;
  search?: string;
}

export function useRecordings(filters?: RecordingsFilter) {
  return useQuery({
    queryKey: ["recordings", filters],
    queryFn: () => recordingService.list(filters),
    refetchInterval: 30000,
  });
}

export function useRecording(id: string) {
  return useQuery({
    queryKey: ["recordings", id],
    queryFn: () => recordingService.get(id),
  });
}

export function useCreateRecording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecordingInput) => recordingService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recordings"] });
      toast.success("Recording added");
    },
    onError: () => toast.error("Failed to add recording"),
  });
}

export function useUpdateRecording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecordingInput }) =>
      recordingService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recordings"] });
      toast.success("Recording updated");
    },
    onError: () => toast.error("Failed to update recording"),
  });
}

export function useDeleteRecording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recordingService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recordings"] });
      toast.success("Recording deleted");
    },
    onError: () => toast.error("Failed to delete recording"),
  });
}

export function useStartMonitoring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recordingService.startMonitoring(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["recordings"] });
      const prev = qc.getQueryData(["recordings"]);
      qc.setQueryData<ReturnType<typeof recordingService.list> extends Promise<infer T> ? T : never>(
        ["recordings"],
        (old) => old?.map((r) => r.rec_id === id ? { ...r, monitor_status: true, status_info: "STATUS_CHECKING" as const } : r)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["recordings"], ctx.prev);
      toast.error("Failed to start monitoring");
    },
  });
}

export function useStopMonitoring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recordingService.stopMonitoring(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["recordings"] });
      const prev = qc.getQueryData(["recordings"]);
      qc.setQueryData<ReturnType<typeof recordingService.list> extends Promise<infer T> ? T : never>(
        ["recordings"],
        (old) => old?.map((r) => r.rec_id === id ? { ...r, monitor_status: false, status_info: "STOPPED_MONITORING" as const } : r)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["recordings"], ctx.prev);
      toast.error("Failed to stop monitoring");
    },
  });
}

export function useBatchDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => recordingService.batchDelete(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recordings"] });
      toast.success("Recordings deleted");
    },
    onError: () => toast.error("Batch delete failed"),
  });
}

export function useBatchStart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => recordingService.batchStart(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recordings"] }),
    onError: () => toast.error("Batch start failed"),
  });
}

export function useBatchStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => recordingService.batchStop(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recordings"] }),
    onError: () => toast.error("Batch stop failed"),
  });
}
