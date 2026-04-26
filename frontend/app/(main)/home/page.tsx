"use client";

import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/glass/glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStatus } from "@/hooks/use-status";
import { useBatchStart, useBatchStop } from "@/hooks/use-recordings";
import {
  RadioTowerIcon,
  TrendingUpIcon,
  VideoIcon,
  MonitorIcon,
  PlusIcon,
  CirclePlayIcon,
  CircleStopIcon,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { data: status, isLoading } = useAppStatus();
  const batchStart = useBatchStart();
  const batchStop = useBatchStop();

  const stats = [
    {
      label: "Monitoring",
      value: status?.monitoring,
      icon: RadioTowerIcon,
      color: "text-blue-400",
    },
    {
      label: "Live Now",
      value: status?.live_streams,
      icon: TrendingUpIcon,
      color: "text-green-400",
    },
    {
      label: "Recording",
      value: status?.active_recordings,
      icon: VideoIcon,
      color: "text-red-400",
    },
    {
      label: "Storage",
      value: status ? (status.recording_enabled ? "OK" : "Full") : undefined,
      icon: MonitorIcon,
      color: status?.recording_enabled ? "text-green-400" : "text-destructive",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your streams and recordings
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <GlassCard key={label} padding="md" className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon className={`size-4 ${color}`} />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold">{value ?? "—"}</p>
            )}
          </GlassCard>
        ))}
      </div>

      <GlassCard padding="lg">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => router.push("/recordings")}>
            <PlusIcon className="size-4" />
            Add Recording
          </Button>
          <Button
            variant="outline"
            onClick={() => batchStart.mutate([])}
            disabled={batchStart.isPending}
          >
            <CirclePlayIcon className="size-4" />
            Start All
          </Button>
          <Button
            variant="outline"
            onClick={() => batchStop.mutate([])}
            disabled={batchStop.isPending}
          >
            <CircleStopIcon className="size-4" />
            Stop All
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
