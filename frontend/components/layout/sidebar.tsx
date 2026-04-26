"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { GlassSidebar } from "@/components/glass/glass-sidebar";
import { buttonVariants } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  HomeIcon,
  VideoIcon,
  HardDriveIcon,
  SettingsIcon,
  InfoIcon,
  PanelLeftIcon,
  CastIcon,
} from "lucide-react";

const navItems = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/recordings", label: "Recordings", icon: VideoIcon },
  { href: "/storage", label: "Storage", icon: HardDriveIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
  { href: "/about", label: "About", icon: InfoIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <GlassSidebar collapsed={sidebarCollapsed} className="flex flex-col">
      <div
        className={cn(
          "flex items-center h-16 px-4 border-b border-white/15 shrink-0 text-white",
          sidebarCollapsed ? "justify-center" : "gap-3"
        )}
      >
        <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white/16 shadow-inner shadow-white/15">
          <CastIcon className="size-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="text-base font-semibold tracking-tight">StreamCap</span>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        <TooltipProvider>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            const linkClass = cn(
              "flex items-center gap-3 rounded-2xl text-sm font-medium transition-all",
              "hover:bg-white/14 hover:shadow-inner hover:shadow-white/10",
              sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-2",
              isActive
                ? "bg-white/22 text-white border border-white/24 shadow-lg shadow-indigo-950/20"
                : "text-white/76 hover:text-white border border-transparent"
            );

            return (
              <Tooltip key={href}>
                <TooltipTrigger
                  render={<Link href={href} />}
                  className={linkClass}
                >
                  <Icon className="size-4 shrink-0" />
                  {!sidebarCollapsed && <span>{label}</span>}
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right">{label}</TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      <div className="p-2 border-t border-white/15 shrink-0">
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "w-full text-white/80 hover:bg-white/14 hover:text-white",
            sidebarCollapsed ? "justify-center" : "justify-end"
          )}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeftIcon
            className={cn(
              "size-4 transition-transform duration-300",
              sidebarCollapsed && "rotate-180"
            )}
          />
        </button>
      </div>
    </GlassSidebar>
  );
}
