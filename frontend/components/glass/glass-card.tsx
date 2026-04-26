import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const glassCardVariants = cva("rounded-xl border glass-shadow", {
  variants: {
    blur: {
      sm: "glass-sm",
      md: "glass",
      lg: "glass-lg",
    },
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    },
  },
  defaultVariants: {
    blur: "md",
    padding: "md",
  },
});

interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

export function GlassCard({ blur, padding, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(glassCardVariants({ blur, padding }), className)}
      {...props}
    />
  );
}
