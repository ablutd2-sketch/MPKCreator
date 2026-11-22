import { Link } from "@tanstack/react-router";

const TABS = [
  { to: "/builder", label: "Pojazdy", exact: true },
  { to: "/builder/trasy", label: "Trasy i przystanki" },
  { to: "/builder/kursy", label: "Kursy i rozkład" },
];

export default function BuilderNav() {
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          activeOptions={{ exact: Boolean(tab.exact) }}
          className="whitespace-nowrap rounded-full px-4 py-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "bg-primary text-primary-foreground hover:text-primary-foreground" }}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
