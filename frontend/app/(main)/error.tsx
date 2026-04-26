"use client";

import { useEffect } from "react";
import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";
import { GlassCard } from "@/components/glass/glass-card";
import { Button } from "@/components/ui/button";

export default function MainError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <GlassCard padding="lg" className="max-w-md text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangleIcon className="size-6" />
        </div>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page could not be loaded. Try again or return later.
        </p>
        <Button className="mt-6" onClick={() => unstable_retry()}>
          <RotateCcwIcon className="size-4" />
          Try again
        </Button>
      </GlassCard>
    </div>
  );
}
