import AppHeader from "@/components/AppHeader";

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
