import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { GoogleLogin } from "@react-oauth/google";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export function LoginPage() {
  const { loginWithGoogle, isLoggingIn, isAuthenticated, isHydrated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isHydrated && isAuthenticated) void navigate({ to: "/", replace: true });
  }, [isHydrated, isAuthenticated, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Ambient glow accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-info/5 blur-[120px]"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card/80 p-10 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-info shadow-glow-primary">
            <Mail className="h-7 w-7 text-primary-foreground" aria-hidden />
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground">
            ReachInbox
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Schedule emails at scale. Queue campaigns, pace sends, track delivery.
          </p>
        </div>

        <div className="mt-8 flex min-h-[44px] justify-center">
          {isLoggingIn ? (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoadingSpinner /> Signing you in…
            </span>
          ) : (
            <GoogleLogin
              text="continue_with"
              theme="filled_black"
              shape="pill"
              width="320"
              onSuccess={(res) => {
                if (res.credential) void loginWithGoogle(res.credential);
                else toast.error("Google didn't return a credential");
              }}
              onError={() => toast.error("Google sign-in failed")}
            />
          )}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms &amp; Privacy.
        </p>
      </div>
    </div>
  );
}
