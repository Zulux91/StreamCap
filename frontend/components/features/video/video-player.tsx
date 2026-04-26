"use client";

import { useEffect, useRef } from "react";

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
  const playerRef = useRef<{ dispose(): void; isDisposed(): boolean } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    async function init() {
      const videojs = (await import("video.js")).default;
      if (destroyed || !containerRef.current) return;

      const videoEl = document.createElement("video-js");
      videoEl.classList.add("vjs-big-play-centered");
      containerRef.current.appendChild(videoEl);

      const player = videojs(videoEl, {
        controls: true,
        fluid: true,
        preload: "auto",
        sources: [{ src, type: contentType }],
      });

      playerRef.current = player;
    }

    init();

    return () => {
      destroyed = true;
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, contentType]);

  return (
    <div
      ref={containerRef}
      className={`rounded-lg overflow-hidden bg-black ${className}`}
    />
  );
}
