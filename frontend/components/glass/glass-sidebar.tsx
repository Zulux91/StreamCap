import { cn } from "@/lib/utils";

interface GlassSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
}

export function GlassSidebar({ collapsed = false, className, ...props }: GlassSidebarProps) {
  return (
    <div
      className={cn(
        "glass-lg border-r border-white/10 h-full transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-64",
        className
      )}
      {...props}
    />
  );
}
