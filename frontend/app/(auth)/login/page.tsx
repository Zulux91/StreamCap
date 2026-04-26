"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassInput } from "@/components/glass/glass-input";
import { Button } from "@/components/ui/button";
import { CastIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  username: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggingIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: () => router.push("/home"),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
      <GlassCard blur="lg" padding="lg" className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 rounded-full bg-primary/20 border border-primary/30">
            <CastIcon className="size-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">StreamCap</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Username</label>
            <GlassInput
              placeholder="admin"
              autoComplete="username"
              autoFocus
              {...register("username")}
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <GlassInput
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoggingIn}>
            {isLoggingIn ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
