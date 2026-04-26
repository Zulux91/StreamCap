import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function GlassInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <Input
      className={cn(
        "glass-sm border-white/20 bg-white/5",
        "focus-visible:border-primary/50 focus-visible:bg-white/10",
        "dark:bg-black/20 dark:border-white/10 dark:focus-visible:bg-black/30",
        className
      )}
      {...props}
    />
  );
}
