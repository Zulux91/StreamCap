"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/glass/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format-duration";
import { useStartMonitoring, useStopMonitoring, useDeleteRecording } from "@/hooks/use-recordings";
import type { Recording, RecordingStatus } from "@/types/recording";
import {
  PlayIcon,
  SquareIcon,
  PencilIcon,
  Trash2Icon,
  VideoIcon,
  SignalIcon,
} from "lucide-react";

const STATUS_CONFIG: Record<
  RecordingStatus,
  { label: string; textColor: string; borderColor: string; dotColor: string }
> = {
  STATUS_CHECKING: {
    label: "Checking",
    textColor: "text-yellow-400",
    borderColor: "border-yellow-400/30",
    dotColor: "bg-yellow-400",
  },
  MONITORING: {
    label: "Monitoring",
    textColor: "text-blue-400",
    borderColor: "border-blue-400/30",
    dotColor: "bg-blue-400",
  },
  PREPARING_RECORDING: {
    label: "Preparing",
    textColor: "text-orange-400",
    borderColor: "border-orange-400/30",
    dotColor: "bg-orange-400",
  },
  RECORDING: {
    label: "Recording",
    textColor: "text-red-400",
    borderColor: "border-red-400/30",
    dotColor: "bg-red-400 animate-pulse",
  },
  NOT_RECORDING: {
    label: "Idle",
    textColor: "text-muted-foreground",
    borderColor: "border-transparent",
    dotColor: "bg-muted-foreground",
  },
  CHECK_ERROR: {
    label: "Error",
    textColor: "text-destructive",
    borderColor: "border-destructive/30",
    dotColor: "bg-destructive",
  },
  LIVE_STATUS_CHECK_ERROR: {
    label: "Check Error",
    textColor: "text-destructive",
    borderColor: "border-destructive/30",
    dotColor: "bg-destructive",
  },
  STOPPED_MONITORING: {
    label: "Stopped",
    textColor: "text-muted-foreground",
    borderColor: "border-transparent",
    dotColor: "bg-muted-foreground/40",
  },
  RECORDING_ERROR: {
    label: "Error",
    textColor: "text-destructive",
    borderColor: "border-destructive/30",
    dotColor: "bg-destructive",
  },
  NOT_RECORDING_SPACE: {
    label: "No Space",
    textColor: "text-destructive",
    borderColor: "border-destructive/30",
    dotColor: "bg-destructive",
  },
  LIVE_BROADCASTING: {
    label: "Live",
    textColor: "text-green-400",
    borderColor: "border-green-400/30",
    dotColor: "bg-green-400 animate-pulse",
  },
  NOT_IN_SCHEDULED_CHECK: {
    label: "Scheduled",
    textColor: "text-muted-foreground",
    borderColor: "border-transparent",
    dotColor: "bg-muted-foreground/40",
  },
};

const FALLBACK_STATUS = {
  label: "Unknown",
  textColor: "text-muted-foreground",
  borderColor: "border-transparent",
  dotColor: "bg-muted-foreground/40",
};

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
};

const QUALITY_LABELS: Record<string, string> = {
  原画: "Original",
  超清: "UHD",
  高清: "HD",
  标清: "SD",
  流畅: "LD",
};

function getPlatformLabel(recording: Recording) {
  if (recording.platform_key && PLATFORM_LABELS[recording.platform_key]) {
    return PLATFORM_LABELS[recording.platform_key];
  }

  return recording.platform?.replace(/直播/g, "Live") ?? "";
}

function getDisplayTitle(recording: Recording) {
  let title = recording.display_title || recording.url;
  title = title.replace(/^\[直播中\]\s*/, "[Live] ");

  for (const [source, replacement] of Object.entries(QUALITY_LABELS)) {
    title = title.replaceAll(source, replacement);
  }

  return title;
}

function getSpeedLabel(recording: Recording) {
  const speed = recording.speed?.trim();
  if (!recording.is_recording || !speed || speed === "0 KB/s" || speed === "X KB/s") {
    return null;
  }

  return speed;
}

interface RecordingCardProps {
  recording: Recording;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  viewMode: "grid" | "list";
}

export function RecordingCard({
  recording,
  selected,
  onSelect,
  onEdit,
  viewMode,
}: RecordingCardProps) {
  const startMonitoring = useStartMonitoring();
  const stopMonitoring = useStopMonitoring();
  const deleteRecording = useDeleteRecording();
  const durationKey = `${recording.rec_id}:${recording.is_recording}:${recording.cumulative_duration_seconds}`;
  const [durationTick, setDurationTick] = useState({ key: durationKey, value: 0 });

  useEffect(() => {
    if (!recording.is_recording) return;

    const interval = setInterval(() => {
      setDurationTick((current) => ({
        key: durationKey,
        value: current.key === durationKey ? current.value + 1 : 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [durationKey, recording.is_recording]);

  const statusInfo = recording.status_info
    ? STATUS_CONFIG[recording.status_info] ?? FALLBACK_STATUS
    : FALLBACK_STATUS;
  const displayedDuration =
    recording.cumulative_duration_seconds +
    (durationTick.key === durationKey ? durationTick.value : 0);
  const platformLabel = getPlatformLabel(recording);
  const displayTitle = getDisplayTitle(recording);
  const speedLabel = getSpeedLabel(recording);

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    startMonitoring.mutate(recording.rec_id);
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopMonitoring.mutate(recording.rec_id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${recording.streamer_name}"?`)) {
      deleteRecording.mutate(recording.rec_id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(recording.rec_id);
  };

  if (viewMode === "list") {
    return (
      <GlassCard
        padding="sm"
        className={cn(
          "cursor-pointer transition-all flex items-center gap-3",
          selected && "ring-2 ring-primary/50",
          statusInfo.borderColor
        )}
        onClick={() => onSelect(recording.rec_id)}
      >
        <div
          className={cn("size-2 rounded-full shrink-0", statusInfo.dotColor)}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{recording.streamer_name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {displayTitle}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {platformLabel && (
            <Badge variant="secondary" className="text-xs hidden sm:flex">
              {platformLabel}
            </Badge>
          )}
          <Badge variant="outline" className={cn("text-xs", statusInfo.textColor)}>
            {statusInfo.label}
          </Badge>
          {recording.is_recording && (
            <span className="text-xs text-muted-foreground hidden md:block">
              {formatDuration(displayedDuration)}
            </span>
          )}
          {speedLabel && (
            <span className="text-xs text-muted-foreground hidden lg:block">
              {speedLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {recording.monitor_status ? (
            <Button size="icon-sm" variant="ghost" onClick={handleStop}>
              <SquareIcon className="size-3.5" />
            </Button>
          ) : (
            <Button size="icon-sm" variant="ghost" onClick={handleStart}>
              <PlayIcon className="size-3.5" />
            </Button>
          )}
          <Button size="icon-sm" variant="ghost" onClick={handleEdit}>
            <PencilIcon className="size-3.5" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      padding="md"
      className={cn(
        "cursor-pointer transition-all space-y-3",
        selected && "ring-2 ring-primary/50",
        statusInfo.borderColor
      )}
      onClick={() => onSelect(recording.rec_id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{recording.streamer_name}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {displayTitle}
          </p>
        </div>
        <div
          className={cn("size-2 rounded-full shrink-0 mt-1.5", statusInfo.dotColor)}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {platformLabel && (
          <Badge variant="secondary" className="text-xs">
            {platformLabel}
          </Badge>
        )}
        <Badge variant="outline" className={cn("text-xs", statusInfo.textColor)}>
          {statusInfo.label}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {recording.quality}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {recording.record_format}
        </Badge>
      </div>

      {(recording.is_recording || speedLabel) && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {recording.is_recording && (
            <span className="flex items-center gap-1">
              <VideoIcon className="size-3 text-red-400" />
              {formatDuration(displayedDuration)}
            </span>
          )}
          {speedLabel && (
            <span className="flex items-center gap-1">
              <SignalIcon className="size-3" />
              {speedLabel}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 pt-1 border-t border-white/5">
        {recording.monitor_status ? (
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleStop}>
            <SquareIcon className="size-3" />
            Stop
          </Button>
        ) : (
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleStart}>
            <PlayIcon className="size-3" />
            Start
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleEdit}>
          <PencilIcon className="size-3" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs hover:text-destructive ml-auto"
          onClick={handleDelete}
        >
          <Trash2Icon className="size-3" />
        </Button>
      </div>
    </GlassCard>
  );
}
