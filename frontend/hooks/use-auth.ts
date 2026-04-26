"use client";

import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth-service";
import { useAuthStore } from "@/stores/auth-store";
import type { LoginRequest } from "@/types/auth";
import toast from "react-hot-toast";

export function useAuth() {
  const { setAuth, logout, isAuthenticated, username, isAdmin } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (data) => {
      setAuth(data.token, data.username, data.is_admin);
    },
    onError: () => toast.error("Invalid username or password"),
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => logout(),
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      authService.changePassword(oldPassword, newPassword),
    onSuccess: () => toast.success("Password changed"),
    onError: () => toast.error("Failed to change password"),
  });

  return {
    isAuthenticated,
    username,
    isAdmin,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    changePassword: changePasswordMutation.mutate,
    isLoggingIn: loginMutation.isPending,
  };
}
