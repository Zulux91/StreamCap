"use client";

import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type GlassTabsListProps = React.ComponentProps<typeof TabsList>;

function GlassTabsList({ className, ...props }: GlassTabsListProps) {
  return (
    <TabsList
      className={cn(
        "glass-sm border border-white/20 dark:border-white/10",
        className
      )}
      {...props}
    />
  );
}

export {
  Tabs as GlassTabs,
  GlassTabsList,
  TabsTrigger as GlassTabsTrigger,
  TabsContent as GlassTabsContent,
};
