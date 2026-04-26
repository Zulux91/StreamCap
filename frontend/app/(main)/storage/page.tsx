"use client";

import { useState } from "react";
import { GlassCard } from "@/components/glass/glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStorageBrowse, useStorageStats, useDeleteFile } from "@/hooks/use-storage";
import { storageService } from "@/services/storage-service";
import { VideoPlayer } from "@/components/features/video/video-player";
import { formatFileSize } from "@/lib/format-file-size";
import { formatDate } from "@/lib/format-date";
import {
  FolderIcon,
  FileVideoIcon,
  FileIcon,
  ChevronRightIcon,
  HomeIcon,
  Trash2Icon,
  PlayIcon,
  HardDriveIcon,
} from "lucide-react";
import type { StorageEntry } from "@/types/api";

const VIDEO_EXTS = [".mp4", ".ts", ".flv", ".mkv", ".mov", ".nut"];

function isVideo(entry: StorageEntry) {
  return VIDEO_EXTS.some((ext) => entry.name.toLowerCase().endsWith(ext));
}

function EntryIcon({ entry }: { entry: StorageEntry }) {
  if (entry.type === "directory") return <FolderIcon className="size-4 shrink-0 text-primary/70" />;
  if (isVideo(entry)) return <FileVideoIcon className="size-4 shrink-0 text-blue-400/70" />;
  return <FileIcon className="size-4 shrink-0 text-muted-foreground" />;
}

export default function StoragePage() {
  const [currentPath, setCurrentPath] = useState<string | undefined>();
  const [preview, setPreview] = useState<StorageEntry | null>(null);

  const { data: browse, isLoading } = useStorageBrowse(currentPath);
  const { data: stats } = useStorageStats();
  const deleteFile = useDeleteFile();
  const entries = browse ?? [];
  const videoCount = entries.filter((entry) => entry.type === "file" && isVideo(entry)).length;

  const breadcrumbs = currentPath ? currentPath.split("/").filter(Boolean) : [];

  const navigateTo = (path?: string) => {
    setCurrentPath(path);
    setPreview(null);
  };

  const navigateCrumb = (idx: number) => {
    navigateTo(breadcrumbs.slice(0, idx + 1).join("/"));
  };

  const handleDelete = (entry: StorageEntry) => {
    if (confirm(`Delete "${entry.name}"?`)) {
      deleteFile.mutate(entry.path);
      if (preview?.path === entry.path) setPreview(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold">Storage</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and manage recorded files
          </p>
        </div>
        {stats && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <HardDriveIcon className="size-4" />
            <span>
              {formatFileSize(stats.used)} / {formatFileSize(stats.total)}
            </span>
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: formatFileSize(stats.total) },
            { label: "Used", value: formatFileSize(stats.used) },
            { label: "Free", value: formatFileSize(stats.free) },
            { label: "Videos", value: String(videoCount) },
          ].map(({ label, value }) => (
            <GlassCard key={label} padding="sm" className="space-y-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-semibold text-sm">{value}</p>
            </GlassCard>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 text-sm flex-wrap">
        <button
          type="button"
          onClick={() => navigateTo(undefined)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <HomeIcon className="size-4" />
        </button>
        {breadcrumbs.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-1">
            <ChevronRightIcon className="size-3.5 text-muted-foreground" />
            <button
              type="button"
              onClick={() => navigateCrumb(idx)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {crumb}
            </button>
          </span>
        ))}
      </div>

      {preview && (
        <GlassCard padding="md">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-sm truncate">{preview.name}</p>
            <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>
              Close
            </Button>
          </div>
          <VideoPlayer
            src={storageService.getVideoUrl(preview.name, currentPath)}
            className="w-full"
          />
        </GlassCard>
      )}

      <GlassCard padding="sm">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : !entries.length ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            {currentPath ? "Empty directory" : "No recorded files yet"}
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {entries.map((entry) => (
              <div
                key={entry.path}
                className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors group cursor-default"
              >
                <EntryIcon entry={entry} />

                <button
                  type="button"
                  className="flex-1 text-left min-w-0"
                  onClick={() => {
                    if (entry.type === "directory") navigateTo(entry.path);
                  }}
                >
                  <p
                    className={`text-sm truncate ${
                      entry.type === "directory"
                        ? "text-primary font-medium hover:underline"
                        : ""
                    }`}
                  >
                    {entry.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.type === "file" ? `${formatFileSize(entry.size)} · ` : ""}
                    {formatDate(entry.modified)}
                  </p>
                </button>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {entry.type === "file" && isVideo(entry) && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setPreview(entry)}
                      aria-label="Preview"
                    >
                      <PlayIcon className="size-3.5" />
                    </Button>
                  )}
                  {entry.type === "file" && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="hover:text-destructive"
                      onClick={() => handleDelete(entry)}
                      aria-label="Delete"
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
