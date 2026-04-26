"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useAuth } from "@/hooks/use-auth";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { SunIcon, MoonIcon, MonitorIcon, UserIcon, LogOutIcon, MenuIcon } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/home": "Home",
  "/recordings": "Recordings",
  "/storage": "Storage",
  "/settings/recording": "Recording Settings",
  "/settings/push": "Push Notifications",
  "/settings/cookies": "Cookies",
  "/settings/accounts": "Accounts",
  "/settings/security": "Security",
  "/settings": "Settings",
  "/about": "About",
};

function getPageTitle(pathname: string): string {
  const match = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([key]) => pathname === key || pathname.startsWith(key + "/"));
  return match?.[1] ?? "StreamCap";
}

const triggerClass = cn(
  buttonVariants({ variant: "ghost", size: "icon" }),
  "hover:bg-white/10 dark:hover:bg-white/5"
);

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme, toggleSidebar } = useUIStore();
  const { username, logout } = useAuth();

  const pageTitle = getPageTitle(pathname);

  return (
    <header className="glass-sm border-b border-white/10 h-14 flex items-center px-4 gap-3 shrink-0">
      <button
        type="button"
        className={cn(triggerClass, "md:hidden")}
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <MenuIcon className="size-5" />
      </button>

      <h1 className="flex-1 text-sm font-semibold">{pageTitle}</h1>

      <DropdownMenu>
        <DropdownMenuTrigger className={triggerClass} aria-label="Toggle theme">
          {theme === "light" ? (
            <SunIcon className="size-4" />
          ) : theme === "dark" ? (
            <MoonIcon className="size-4" />
          ) : (
            <MonitorIcon className="size-4" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass-content glass-shadow">
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <SunIcon className="size-4" /> Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <MoonIcon className="size-4" /> Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <MonitorIcon className="size-4" /> System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger className={triggerClass} aria-label="User menu">
          <UserIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass-content glass-shadow">
          <DropdownMenuLabel className="font-normal">
            <span className="font-medium">{username ?? "User"}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => logout()}>
            <LogOutIcon className="size-4" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
