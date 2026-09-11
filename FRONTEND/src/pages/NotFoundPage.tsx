import { Link } from "@tanstack/react-router";
import { MailX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <span className="rounded-full bg-muted p-4">
        <MailX className="h-6 w-6 text-muted-foreground" aria-hidden />
      </span>
      <h1 className="text-3xl font-semibold tracking-tight">404</h1>
      <p className="text-sm text-muted-foreground">
        We couldn't find the page you were looking for.
      </p>
      <Button asChild className="mt-2">
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
