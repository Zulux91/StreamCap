"use client";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

type GlassDropdownContentProps = React.ComponentProps<typeof DropdownMenuContent>;

function GlassDropdownContent({ className, ...props }: GlassDropdownContentProps) {
  return (
    <DropdownMenuContent
      className={cn(
        "glass-content glass-shadow",
        className
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu as GlassDropdown,
  GlassDropdownContent,
  DropdownMenuItem as GlassDropdownItem,
  DropdownMenuTrigger as GlassDropdownTrigger,
  DropdownMenuSeparator as GlassDropdownSeparator,
  DropdownMenuLabel as GlassDropdownLabel,
  DropdownMenuGroup as GlassDropdownGroup,
};
