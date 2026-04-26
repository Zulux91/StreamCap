export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  detail: string;
  status?: number;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

export interface StorageEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size: number;
  modified: string;
  extension?: string;
}

export interface StorageBrowseResponse {
  entries: StorageEntry[];
  path: string;
  parent_path: string | null;
}

export interface StorageStats {
  total_bytes: number;
  used_bytes: number;
  free_bytes: number;
  file_count: number;
  video_count: number;
}

export interface AppStatus {
  active_recordings: number;
  live_streams: number;
  monitoring: number;
  recording_enabled: boolean;
}

export interface HealthResponse {
  status: "ok";
  version: string;
}

export interface UpdateCheckResponse {
  has_update: boolean;
  latest_version: string;
  current_version: string;
  release_url: string;
  release_notes?: string;
}
