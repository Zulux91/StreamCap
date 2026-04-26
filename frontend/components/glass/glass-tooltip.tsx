"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

type GlassTooltipContentProps = React.ComponentProps<typeof TooltipContent>;

function GlassTooltipContent({ className, ...props }: GlassTooltipContentProps) {
  return (
    <TooltipContent
      className={cn(
        "glass-content text-foreground",
        className
      )}
      {...props}
    />
  );
}

export {
  Tooltip as GlassTooltip,
  GlassTooltipContent,
  TooltipTrigger as GlassTooltipTrigger,
  TooltipProvider as GlassTooltipProvider,
};
