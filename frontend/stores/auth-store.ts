import { create } from "zustand";
import { persist } from "zustand/middleware";

const COOKIE = "streamcap-token";

function setCookie(value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE}=${encodeURIComponent(value)};max-age=86400;path=/;SameSite=Lax`;
}

function clearCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE}=;max-age=0;path=/`;
}

interface AuthState {
  token: string | null;
  username: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  setAuth: (token: string, username: string, isAdmin: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      isAdmin: false,
      isAuthenticated: false,
      setAuth: (token, username, isAdmin) => {
        setCookie(token);
        set({ token, username, isAdmin, isAuthenticated: true });
      },
      logout: () => {
        clearCookie();
        set({ token: null, username: null, isAdmin: false, isAuthenticated: false });
      },
    }),
    {
      name: "streamcap-auth",
      partialize: (state) => ({
        token: state.token,
        username: state.username,
        isAdmin: state.isAdmin,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setCookie(state.token);
      },
    }
  )
);
