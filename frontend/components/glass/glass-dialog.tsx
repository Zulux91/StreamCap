"use client";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

type GlassDialogContentProps = React.ComponentProps<typeof DialogContent>;

function GlassDialogContent({ className, ...props }: GlassDialogContentProps) {
  return (
    <DialogContent
      className={cn(
        "glass-content glass-shadow",
        className
      )}
      {...props}
    />
  );
}

export {
  Dialog as GlassDialog,
  GlassDialogContent,
  DialogHeader as GlassDialogHeader,
  DialogTitle as GlassDialogTitle,
  DialogDescription as GlassDialogDescription,
  DialogFooter as GlassDialogFooter,
  DialogTrigger as GlassDialogTrigger,
  DialogClose as GlassDialogClose,
};
