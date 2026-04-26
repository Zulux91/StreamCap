"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recordingService } from "@/services/recording-service";
import type { CreateRecordingInput, Recording, UpdateRecordingInput } from "@/types/recording";
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

type RecordingsSnapshot = [readonly unknown[], Recording[] | undefined][];

function updateRecordingQueries(
  qc: ReturnType<typeof useQueryClient>,
  updater: (recording: Recording) => Recording
) {
  qc.setQueriesData<Recording[]>({ queryKey: ["recordings"] }, (old) =>
    old?.map(updater) ?? old
  );
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
      const prev = qc.getQueriesData<Recording[]>({ queryKey: ["recordings"] });
      updateRecordingQueries(qc, (r) =>
        r.rec_id === id ? { ...r, monitor_status: true, status_info: "STATUS_CHECKING" } : r
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      ctx?.prev?.forEach(([queryKey, data]: RecordingsSnapshot[number]) => {
        qc.setQueryData(queryKey, data);
      });
      toast.error("Failed to start monitoring");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["recordings"] }),
  });
}

export function useStopMonitoring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recordingService.stopMonitoring(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["recordings"] });
      const prev = qc.getQueriesData<Recording[]>({ queryKey: ["recordings"] });
      updateRecordingQueries(qc, (r) =>
        r.rec_id === id
          ? { ...r, monitor_status: false, is_recording: false, status_info: "STOPPED_MONITORING" }
          : r
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      ctx?.prev?.forEach(([queryKey, data]: RecordingsSnapshot[number]) => {
        qc.setQueryData(queryKey, data);
      });
      toast.error("Failed to stop monitoring");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["recordings"] }),
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
