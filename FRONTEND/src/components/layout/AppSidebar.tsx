import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarClock,
  LayoutDashboard,
  LogOut,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useSentEmails } from "@/hooks/useSentEmails";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const NAV = [
  { title: "Dashboard", url: "/", search: { tab: "scheduled" }, icon: LayoutDashboard, exact: true },
  { title: "Email Schedule", url: "/", search: { tab: "scheduled" }, icon: CalendarClock },
  { title: "Sent", url: "/", search: { tab: "sent" }, icon: Send },
  { title: "Mailing Lists", url: "/lists", search: {}, icon: Users },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  // Dynamically pull total sent emails to calculate plan usage
  const sent = useSentEmails({ limit: 1, page: 1 }, Boolean(user));
  const totalSent = sent.data?.total ?? 0;
  const PLAN_LIMIT = 1000;
  const percentage = Math.min(100, Math.round((totalSent / PLAN_LIMIT) * 100));

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-2 p-4", collapsed ? "justify-center" : "justify-between")}>
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-info shadow-glow-primary">
            <Mail className="h-4 w-4 text-primary-foreground" aria-hidden />
          </span>
          {!collapsed && (
            <span className="truncate font-display text-lg font-bold tracking-tight text-foreground">
              ReachInbox
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mb-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-3">
        {NAV.map((item, i) => {
          const active = item.exact ? currentPath === item.url && i === 0 : false;
          return (
            <Link
              key={item.title}
              to={item.url}
              search={item.search}
              title={collapsed ? item.title : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                collapsed && "justify-center px-0",
                active
                  ? "border-l-2 border-primary bg-sidebar-accent text-foreground"
                  : "border-l-2 border-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Plan usage */}
      {!collapsed && (
        <div className="px-4 pb-3">
          <div className="rounded-xl border border-border bg-gradient-to-br from-primary/10 to-info/10 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
              Plan Usage
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-primary to-info transition-all duration-500 ease-out" 
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {totalSent.toLocaleString()} of {PLAN_LIMIT.toLocaleString()} emails sent
            </p>
          </div>
        </div>
      )}

      {/* User footer */}
      {user && (
        <div className={cn("flex items-center gap-3 border-t border-border p-4", collapsed && "justify-center")}>
          <Avatar className="h-9 w-9 shrink-0 border border-border">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
            <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <button
                onClick={() => void logout()}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-destructive"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
