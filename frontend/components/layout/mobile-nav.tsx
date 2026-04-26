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
    <nav className="fixed bottom-0 left-0 right-0 md:hidden glass-sm border-t border-white/10 z-40 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 flex-1 py-2 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
