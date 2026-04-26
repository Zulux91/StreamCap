"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HomeIcon, VideoIcon, HardDriveIcon, SettingsIcon } from "lucide-react";

const navItems = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/recordings", label: "Recordings", icon: VideoIcon },
  { href: "/storage", label: "Storage", icon: HardDriveIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden glass-sm border-t border-white/15 z-40 pb-safe shadow-2xl shadow-indigo-950/30">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 flex-1 py-2 text-xs transition-colors",
                isActive ? "text-white drop-shadow" : "text-foreground/66 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-5 rounded-xl transition-all",
                  isActive && "bg-primary/85 p-1 shadow-lg shadow-primary/25"
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
