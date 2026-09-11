import { api } from "@/lib/api";
import type { AuthResponse, User } from "@/types/auth.types";

export const authService = {
  loginWithGoogle: (credential: string) =>
    api.post<AuthResponse>("/auth/google", { credential }).then((r) => r.data),
  getMe: () => api.get<User>("/auth/me").then((r) => r.data),
  logout: () => api.post("/auth/logout"),
};
