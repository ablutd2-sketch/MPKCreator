import LineBadge from "@/components/LineBadge";
import { formatClock } from "@/lib/simulation";

export default function DepartureBoard({ stop, groups = [], dayLabel }) {
  if (!stop) {
    return <div className="surface p-6 text-[13px] text-muted-foreground">Wybierz przystanek z listy po lewej.</div>;
  }

  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
        <div>
          <p className="eyebrow">Tabela odjazdów</p>
          <h2 className="mt-1 font-display text-xl leading-none">{stop.name}</h2>
        </div>
        <div className="text-right">
          <p className="num text-[11px] font-semibold text-foreground">{total} odjazdów</p>
          <p className="text-[11px] text-muted-foreground">{dayLabel}</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">Brak odjazdów w wybranym dniu.</p>
      ) : (
        <div className="divide-y divide-border/60">
          {groups.map((group) => (
            <div key={group.hour} className="flex gap-3 px-4 py-2.5">
              <span className="num w-8 shrink-0 pt-0.5 text-[13px] font-semibold text-muted-foreground">
                {String(group.hour).padStart(2, "0")}
              </span>
              <ul className="min-w-0 flex-1 space-y-1.5">
                {group.items.map((row, index) => (
                  <li key={`${row.brigade}-${row.minutes}-${index}`} className="flex items-center gap-2">
                    <span className="num w-11 shrink-0 text-[13px] font-semibold text-foreground">
                      {formatClock(row.minutes)}
                    </span>
                    <LineBadge line={row.line} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-[12px] text-foreground">→ {row.direction}</span>
                    <span className="num shrink-0 text-[10px] text-muted-foreground">{row.brigade}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
