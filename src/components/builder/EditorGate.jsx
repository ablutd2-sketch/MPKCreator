import { LockKeyhole, LogIn } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

function Notice({ title, body, actionLabel, onAction }) {
  return (
    <div className="surface flex flex-col items-center px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
        <LockKeyhole className="h-5 w-5 text-muted-foreground" />
      </span>
      <h2 className="mt-4 font-display text-2xl">{title}</h2>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12px] font-semibold text-primary-foreground"
        >
          <LogIn className="h-3.5 w-3.5" /> {actionLabel}
        </button>
      )}
    </div>
  );
}

export default function EditorGate({ children }) {
  const { user, isAuthenticated, isLoadingAuth, navigateToLogin } = useAuth();

  if (isLoadingAuth) {
    return <div className="surface p-6 text-[13px] text-muted-foreground">Sprawdzam dostęp…</div>;
  }

  if (!isAuthenticated) {
    return (
      <Notice
        title="Zaloguj się, aby edytować"
        body="Dodawanie pojazdów, tras i kursów jest dostępne po zalogowaniu na konto operatora. Mapa i wykaz taboru pozostają otwarte dla wszystkich."
        actionLabel="Zaloguj się"
        onAction={() => navigateToLogin()}
      />
    );
  }

  if (!String(user?.role || "").includes("admin")) {
    return (
      <Notice
        title="Edycja dla administratora"
        body="Twoje konto nie ma uprawnień do zmiany taboru. Poproś administratora aplikacji o rolę administratora."
      />
    );
  }

  return children;
}
