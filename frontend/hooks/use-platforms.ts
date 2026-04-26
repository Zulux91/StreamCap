"use client";

import { useQuery } from "@tanstack/react-query";
import { platformService } from "@/services/platform-service";

export function usePlatforms() {
  return useQuery({
    queryKey: ["platforms"],
    queryFn: platformService.list,
    staleTime: 300000,
  });
}

export function useDetectPlatform(url: string) {
  return useQuery({
    queryKey: ["platforms", "detect", url],
    queryFn: () => platformService.detect(url),
    enabled: url.startsWith("http"),
    staleTime: 60000,
  });
}
