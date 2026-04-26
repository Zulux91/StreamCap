import { api } from "./api";
import type {
  Recording,
  CreateRecordingInput,
  UpdateRecordingInput,
  BatchOperationResult,
} from "@/types/recording";

export const recordingService = {
  list: async (params?: {
    status?: string;
    platform?: string;
    search?: string;
  }): Promise<Recording[]> => {
    const res = await api.get<{ recordings: Recording[] }>("/api/recordings", { params });
    return res.data.recordings;
  },

  get: async (id: string): Promise<Recording> => {
    const res = await api.get<Recording>(`/api/recordings/${id}`);
    return res.data;
  },

  create: async (data: CreateRecordingInput): Promise<Recording> => {
    const res = await api.post<Recording>("/api/recordings", data);
    return res.data;
  },

  update: async (id: string, data: UpdateRecordingInput): Promise<Recording> => {
    const res = await api.put<Recording>(`/api/recordings/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/recordings/${id}`);
  },

  startMonitoring: async (id: string): Promise<void> => {
    await api.post(`/api/recordings/${id}/start`);
  },

  stopMonitoring: async (id: string): Promise<void> => {
    await api.post(`/api/recordings/${id}/stop`);
  },

  batchDelete: async (ids: string[]): Promise<BatchOperationResult> => {
    const res = await api.post<BatchOperationResult>("/api/recordings/batch/delete", { ids });
    return res.data;
  },

  batchStart: async (ids: string[]): Promise<BatchOperationResult> => {
    const res = await api.post<BatchOperationResult>("/api/recordings/batch/start", { ids });
    return res.data;
  },

  batchStop: async (ids: string[]): Promise<BatchOperationResult> => {
    const res = await api.post<BatchOperationResult>("/api/recordings/batch/stop", { ids });
    return res.data;
  },
};
