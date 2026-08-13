import { Link } from "@tanstack/react-router";
import {
  Hand,
  MessagesSquare,
  GraduationCap,
  Siren,
  History,
  User,
  Settings,
  Shield,
  Dumbbell,
} from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/translate", label: "Translate", icon: Hand },
  { to: "/conversation", label: "Conversation", icon: MessagesSquare },
  { to: "/learn", label: "Learn", icon: GraduationCap },
  { to: "/practice", label: "Practice", icon: Dumbbell },
  { to: "/emergency", label: "Emergency", icon: Siren },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/admin", label: "Admin", icon: Shield },
] as const;

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="gradient-hero grid size-9 place-items-center rounded-xl text-primary-foreground">
              <Hand className="size-5" aria-hidden />
            </span>
            SignBridge
          </Link>
          <nav
            aria-label="Main"
            className="ml-auto hidden flex-wrap items-center gap-1 lg:flex"
          >
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 lg:pb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">{description}</p>
        ) : null}
        <div className="mt-6">{children}</div>
      </main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:hidden"
      >
        <ul className="mx-auto flex max-w-6xl items-stretch justify-between overflow-x-auto px-1">
          {NAV.slice(0, 5).map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className="flex min-h-16 min-w-16 flex-col items-center justify-center gap-1 px-1 text-[0.7rem] font-semibold text-muted-foreground"
                activeProps={{ className: "text-primary" }}
              >
                <Icon className="size-6" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}