import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import { getErrorMessage } from "@/lib/api";

export function useAuth() {
  const navigate = useNavigate();
  const { user, token, setAuth, logout: clearAuth } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Zustand persist rehydrates on the client only; wait before gating routes.
  useEffect(() => {
    setIsHydrated(true);
    if (token) {
      authService.getMe().then(useAuthStore.getState().setUser).catch(() => {});
    }
  }, [token]);

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      setIsLoggingIn(true);
      try {
        const res = await authService.loginWithGoogle(credential);
        setAuth(res.user, res.token);
        toast.success(`Welcome back, ${res.user.name.split(" ")[0]}`);
        void navigate({ to: "/" });
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Could not sign you in"));
      } finally {
        setIsLoggingIn(false);
      }
    },
    [navigate, setAuth],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Server-side logout is best effort; local session is cleared regardless.
    }
    clearAuth();
    void navigate({ to: "/login" });
  }, [clearAuth, navigate]);

  return {
    user,
    token,
    isAuthenticated: Boolean(token),
    isHydrated,
    isLoggingIn,
    loginWithGoogle,
    logout,
  };
}
