import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type GlassButtonProps = React.ComponentProps<typeof Button>;

export function GlassButton({ className, variant = "ghost", ...props }: GlassButtonProps) {
  return (
    <Button
      variant={variant}
      className={cn(
        "glass-sm border-white/20 hover:border-white/30",
        "dark:border-white/10 dark:hover:border-white/20",
        className
      )}
      {...props}
    />
  );
}
