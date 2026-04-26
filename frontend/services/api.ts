import axios, { type AxiosRequestConfig } from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/auth-store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:6007";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 750;
const RETRYABLE_METHODS = new Set(["get", "head", "options"]);

type RetryConfig = AxiosRequestConfig & { __retryCount?: number };

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(status?: number, method?: string) {
  return Boolean(
    status &&
      status >= 500 &&
      RETRYABLE_METHODS.has(method?.toLowerCase() ?? "get")
  );
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    const config = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    if (config && shouldRetry(status, config.method)) {
      config.__retryCount = config.__retryCount ?? 0;
      if (config.__retryCount < MAX_RETRIES) {
        config.__retryCount += 1;
        await delay(RETRY_DELAY_MS * config.__retryCount);
        return api(config);
      }
    }

    if (typeof window !== "undefined" && status && status >= 500) {
      toast.error("Server error. Please try again.");
    }

    return Promise.reject(error);
  }
);
