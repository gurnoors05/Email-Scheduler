import { Link } from "@tanstack/react-router";
import { LogOut, Mail, Slack, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { API_URL } from "@/lib/api";
import { ArchitectureInfoModal } from "./ArchitectureInfoModal";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      {user && !user.slackConnected ? (
        <div className="flex flex-wrap items-center justify-center gap-3 bg-primary/5 px-4 py-2 text-sm text-foreground">
          <span className="text-muted-foreground">
            Connect Slack to get rate-limit alerts
          </span>
          <Button asChild size="sm" variant="outline" className="h-7">
            <a href={`${API_URL}/auth/slack?token=${useAuthStore.getState().token}`}>
              <Slack className="h-3.5 w-3.5" />
              Connect Slack
            </a>
          </Button>
        </div>
      ) : null}

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mail className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight">ReachInbox</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <ArchitectureInfoModal />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
                <Avatar className="h-9 w-9">
                  {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-sm font-medium">{user.name}</span>
                  <span className="block text-xs text-muted-foreground">{user.email}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void logout()}>
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        ) : null}
      </div>
    </header>
  );
}
