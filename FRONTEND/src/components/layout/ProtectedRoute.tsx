import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isHydrated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) void navigate({ to: "/login", replace: true });
  }, [isHydrated, isAuthenticated, navigate]);

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
