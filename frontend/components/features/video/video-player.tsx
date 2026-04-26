"use client";

import { useRef, useState } from "react";
import {
  MaximizeIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  RotateCwIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const VOLUME_KEY = "streamcap-video-volume";
const MUTED_KEY = "streamcap-video-muted";
const POSITION_PREFIX = "streamcap-video-position:";
const POSITION_SAVE_INTERVAL_SECONDS = 2;

interface VideoPlayerProps {
  src: string;
  contentType?: string;
  className?: string;
}

export function VideoPlayer({
  src,
  contentType = "video/mp4",
  className = "",
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const restoredPositionRef = useRef(false);
  const lastSavedPositionRef = useRef(0);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const hasDuration = Number.isFinite(duration) && duration > 0;
  const positionKey = `${POSITION_PREFIX}${src}`;

  const getStoredNumber = (key: string) => {
    if (typeof window === "undefined") return null;
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) ? value : null;
  };

  const getStoredBoolean = (key: string) => {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem(key);
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
  };

  const savePosition = (time = videoRef.current?.currentTime) => {
    if (typeof window === "undefined" || !Number.isFinite(time)) return;
    window.localStorage.setItem(positionKey, String(time));
  };

  const clearPosition = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(positionKey);
  };

  const formatTime = (value: number) => {
    if (!Number.isFinite(value) || value < 0) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      await video.play();
    } else {
      video.pause();
    }
  };

  const seekBy = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), duration || video.currentTime + seconds);
    savePosition(video.currentTime);
  };

  const seekTo = (value: string) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Number(value);
    savePosition(video.currentTime);
  };

  const changeVolume = (value: string) => {
    const nextVolume = Number(value);
    const video = videoRef.current;
    if (!video) return;

    video.volume = nextVolume;
    video.muted = nextVolume === 0;
    setVolume(nextVolume);
    setMuted(video.muted);
    window.localStorage.setItem(VOLUME_KEY, String(nextVolume));
    window.localStorage.setItem(MUTED_KEY, String(video.muted));
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    window.localStorage.setItem(MUTED_KEY, String(video.muted));
  };

  const restorePlaybackState = (video: HTMLVideoElement) => {
    const storedVolume = getStoredNumber(VOLUME_KEY);
    const storedMuted = getStoredBoolean(MUTED_KEY);
    const storedPosition = getStoredNumber(positionKey);

    if (storedVolume !== null) {
      video.volume = Math.min(Math.max(storedVolume, 0), 1);
    }
    if (storedMuted !== null) {
      video.muted = storedMuted;
    }
    if (
      !restoredPositionRef.current &&
      storedPosition !== null &&
      storedPosition > 0 &&
      storedPosition < video.duration - 2
    ) {
      video.currentTime = storedPosition;
      setCurrentTime(storedPosition);
    }
    restoredPositionRef.current = true;
  };

  const handleMetadataLoaded = (video: HTMLVideoElement) => {
    setDuration(video.duration);
    restorePlaybackState(video);
  };

  const handleTimeUpdate = (video: HTMLVideoElement) => {
    setCurrentTime(video.currentTime);
    if (Math.abs(video.currentTime - lastSavedPositionRef.current) >= POSITION_SAVE_INTERVAL_SECONDS) {
      savePosition(video.currentTime);
      lastSavedPositionRef.current = video.currentTime;
    }
  };

  const enterFullscreen = async () => {
    await containerRef.current?.requestFullscreen();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-indigo-950/30",
        className
      )}
    >
      <video
        ref={videoRef}
        className="block max-h-[72vh] min-h-64 w-full bg-black object-contain"
        preload="metadata"
        playsInline
        onClick={togglePlay}
        onPlay={() => setPaused(false)}
        onPause={(event) => {
          setPaused(true);
          savePosition(event.currentTarget.currentTime);
        }}
        onLoadedMetadata={(event) => handleMetadataLoaded(event.currentTarget)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => handleTimeUpdate(event.currentTarget)}
        onEnded={clearPosition}
        onVolumeChange={(event) => {
          setMuted(event.currentTarget.muted);
          setVolume(event.currentTarget.volume);
        }}
      >
        <source src={src} type={contentType} />
      </video>

      <div className="space-y-3 border-t border-white/10 bg-slate-950/92 px-4 py-3 text-white backdrop-blur-xl">
        <input
          type="range"
          min="0"
          max={hasDuration ? duration : 0}
          step="0.1"
          value={hasDuration ? currentTime : 0}
          onChange={(event) => seekTo(event.target.value)}
          disabled={!hasDuration}
          aria-label="Seek video"
          className="h-2 w-full cursor-pointer accent-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
        />

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            onClick={togglePlay}
            className="grid size-9 place-items-center rounded-full bg-white/14 text-white transition hover:bg-white/22"
            aria-label={paused ? "Play" : "Pause"}
          >
            {paused ? <PlayIcon className="size-4" /> : <PauseIcon className="size-4" />}
          </button>

          <button
            type="button"
            onClick={() => seekBy(-10)}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-white/10 px-3 transition hover:bg-white/18"
          >
            <RotateCcwIcon className="size-4" /> 10s
          </button>

          <button
            type="button"
            onClick={() => seekBy(10)}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-white/10 px-3 transition hover:bg-white/18"
          >
            <RotateCwIcon className="size-4" /> 10s
          </button>

          <span className="font-mono text-xs text-white/76">
            {formatTime(currentTime)} / {hasDuration ? formatTime(duration) : "-:--"}
          </span>

          <div className="ml-auto flex min-w-44 items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="grid size-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/18"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? <VolumeXIcon className="size-4" /> : <Volume2Icon className="size-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              onChange={(event) => changeVolume(event.target.value)}
              aria-label="Volume"
              className="w-24 cursor-pointer accent-violet-400 sm:w-32"
            />
            <button
              type="button"
              onClick={enterFullscreen}
              className="grid size-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/18"
              aria-label="Fullscreen"
            >
              <MaximizeIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
