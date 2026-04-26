"use client";

import { GlassCard } from "@/components/glass/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useUpdateCheck } from "@/hooks/use-status";
import type { HealthResponse } from "@/types/api";
import {
  CastIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "lucide-react";

export default function AboutPage() {
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await api.get<HealthResponse>("/api/health");
      return res.data;
    },
    staleTime: 60000,
  });

  const {
    data: updates,
    isLoading: updatesLoading,
    refetch: checkUpdates,
    isFetching,
  } = useUpdateCheck();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">About</h2>
        <p className="text-sm text-muted-foreground mt-1">
          StreamCap information and updates
        </p>
      </div>

      <GlassCard padding="lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-full bg-primary/20 border border-primary/30">
            <CastIcon className="size-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">StreamCap</h3>
            <p className="text-sm text-muted-foreground">Live stream recording manager</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm text-muted-foreground">Current Version</span>
            {healthLoading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <Badge variant="secondary">{health?.version ?? "—"}</Badge>
            )}
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm text-muted-foreground">Backend Status</span>
            {healthLoading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <Badge
                variant="outline"
                className={health ? "text-green-400 border-green-400/30" : "text-destructive border-destructive/30"}
              >
                {health ? "Online" : "Offline"}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-sm text-muted-foreground">Latest Version</span>
              {updates && !updatesLoading && (
                <span className="ml-2 text-sm font-medium">{updates.latest_version}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {updates && !isFetching && (
                updates.has_update ? (
                  <div className="flex items-center gap-1.5 text-sm text-yellow-400">
                    <AlertCircleIcon className="size-4" />
                    Update available
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm text-green-400">
                    <CheckCircleIcon className="size-4" />
                    Up to date
                  </div>
                )
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => void checkUpdates()}
                disabled={isFetching}
              >
                <RefreshCwIcon className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
                Check
              </Button>
            </div>
          </div>
        </div>

        {updates?.has_update && updates.release_url && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <Button
              render={
                <a
                  href={updates.release_url}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              variant="outline"
              className="w-full sm:w-auto"
            >
              <ExternalLinkIcon className="size-4" />
              View Release
            </Button>
            {updates.release_notes && (
              <p className="text-xs text-muted-foreground mt-3 whitespace-pre-wrap">
                {updates.release_notes}
              </p>
            )}
          </div>
        )}
      </GlassCard>

      <GlassCard padding="md">
        <h3 className="font-semibold mb-3">Links</h3>
        <div className="space-y-2">
          <a
            href="https://github.com/ihmily/StreamCap"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLinkIcon className="size-3.5" />
            GitHub Repository
          </a>
        </div>
      </GlassCard>
    </div>
  );
}
