"use client";

import { GlassInput } from "@/components/glass/glass-input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SearchIcon, XIcon, LayoutGridIcon, ListIcon } from "lucide-react";
import { usePlatforms } from "@/hooks/use-platforms";

interface RecordingFiltersProps {
  search: string;
  status: string;
  platform: string;
  viewMode: "grid" | "list";
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onPlatformChange: (v: string) => void;
  onViewModeChange: (v: "grid" | "list") => void;
}

const STATUS_OPTIONS = [
  { value: "recording", label: "Recording" },
  { value: "live", label: "Live" },
  { value: "monitoring", label: "Monitoring" },
  { value: "stopped", label: "Stopped" },
  { value: "error", label: "Error" },
];

export function RecordingFilters({
  search,
  status,
  platform,
  viewMode,
  onSearchChange,
  onStatusChange,
  onPlatformChange,
  onViewModeChange,
}: RecordingFiltersProps) {
  const { data: platforms } = usePlatforms();
  const hasFilters = search || status || platform;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-36">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <GlassInput
          placeholder="Search…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>

      <Select
        value={status || "_all"}
        onValueChange={(v) => onStatusChange(v === "_all" ? "" : (v ?? ""))}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All Status</SelectItem>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={platform || "_all"}
        onValueChange={(v) => onPlatformChange(v === "_all" ? "" : (v ?? ""))}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All Platforms</SelectItem>
          {platforms?.map((p) => (
            <SelectItem key={p.key} value={p.key}>
              {p.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onSearchChange("");
            onStatusChange("");
            onPlatformChange("");
          }}
        >
          <XIcon className="size-3.5" />
          Clear
        </Button>
      )}

      <div className="flex items-center border border-white/10 rounded-lg overflow-hidden ml-auto">
        <button
          type="button"
          onClick={() => onViewModeChange("grid")}
          className={`p-1.5 transition-colors ${
            viewMode === "grid"
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label="Grid view"
        >
          <LayoutGridIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("list")}
          className={`p-1.5 transition-colors ${
            viewMode === "list"
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label="List view"
        >
          <ListIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
