"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useRealtime } from "@/hooks/use-realtime";

export function MainLayout({ children }: { children: React.ReactNode }) {
  useRealtime();

  return (
    <div className="flex h-screen overflow-hidden gradient-bg">
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
