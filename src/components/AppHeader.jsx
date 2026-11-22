import { Link } from "@tanstack/react-router";
import { Bus, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const NAV = [
  { to: "/", label: "Mapa na żywo", exact: true },
  { to: "/fleet", label: "Tabor / Pojazdy" },
  { to: "/builder", label: "Kreator tras" },
  { to: "/rozklad", label: "Rozkład jazdy" },
];

export default function AppHeader() {
  const { user, isAuthenticated, isLoadingAuth, logout, navigateToLogin } = useAuth();

  return (
    <header className="sticky top-0 z-[900] border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-primary text-primary-foreground sm:h-9 sm:w-9">
            <Bus className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="font-display text-[19px] leading-none tracking-tight">BusTracker PL</span>
            <span className="eyebrow mt-1 text-[8px] tracking-[0.22em]">Panel dyspozytorski</span>
          </span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: Boolean(item.exact) }}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {isLoadingAuth ? null : isAuthenticated ? (
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden max-w-[150px] truncate text-xs text-muted-foreground md:inline">
              {user?.full_name || user?.email}
            </span>
            <button
              type="button"
              onClick={() => logout()}
              className="flex h-8 items-center gap-1.5 rounded-full border border-border px-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Wyloguj</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigateToLogin()}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Zaloguj się</span>
          </button>
        )}
      </div>
    </header>
  );
}
