import { useEffect, useRef, useState } from "react";
import { Pause, Play, Radio } from "lucide-react";
import { useSimulation } from "@/lib/SimulationContext";
import { DAY_CHIPS, DAY_KEYS, formatClock, parseTime } from "@/lib/simulation";
import { cn } from "@/lib/utils";

const SPEEDS = [1, 2, 5];

function ModeToggle() {
  const { mode, setMode, setRunning } = useSimulation();

  return (
    <div className="flex rounded-xl bg-secondary p-1">
      {[
        { id: "sim", label: "Tryb symulacji" },
        { id: "live", label: "Dane na żywo" },
      ].map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => {
            setMode(option.id);
            if (option.id === "live") setRunning(false);
          }}
          className={cn(
            "flex-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all",
            mode === option.id
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SimulationPanel({ onStart, onPause, activeCount, dayHasCourses }) {
  const { running, speed, setSpeed, dayKey, setDayKey, simMinutes, setSimMinutes } = useSimulation();
  const [draft, setDraft] = useState(() => formatClock(simMinutes));
  const editing = useRef(false);

  useEffect(() => {
    if (!editing.current) setDraft(formatClock(simMinutes));
  }, [simMinutes]);

  const applyDraft = () => {
    const minutes = parseTime(draft);
    if (minutes == null) setDraft(formatClock(simMinutes));
    else setSimMinutes(minutes);
  };

  return (
    <div className="mt-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="eyebrow">Zegar symulacji</p>
          <p className="num mt-0.5 text-[26px] font-semibold leading-none tracking-tight">{formatClock(simMinutes)}</p>
        </div>
        <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-medium text-muted-foreground">
          {activeCount} w trasie
        </span>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {DAY_KEYS.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => setDayKey(day)}
            className={cn(
              "rounded-md py-1 font-mono text-[10px] font-medium transition-colors",
              dayKey === day ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {DAY_CHIPS[day]}
          </button>
        ))}
      </div>

      {!dayHasCourses && (
        <p className="mt-2 rounded-lg bg-secondary/70 px-2 py-1.5 text-[10.5px] leading-snug text-muted-foreground">
          W wybranym dniu żadna brygada nie ma kursów. Zmień dzień albo dopisz rozkład w kreatorze.
        </p>
      )}

      <label className="mt-2 flex items-center gap-2 rounded-lg bg-secondary/70 px-2 py-1.5">
        <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Start od godziny</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="HH:MM"
          value={draft}
          onFocus={() => {
            editing.current = true;
          }}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            editing.current = false;
            applyDraft();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className="num ml-auto h-7 w-[74px] rounded-md border border-border bg-card px-1.5 text-center text-[11px] text-foreground outline-none focus:border-primary"
        />
      </label>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={onStart}
          disabled={running}
          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-[12px] font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <Play className="h-3.5 w-3.5" /> Start
        </button>
        <button
          type="button"
          onClick={onPause}
          disabled={!running}
          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-[12px] font-semibold text-foreground transition-opacity disabled:opacity-40"
        >
          <Pause className="h-3.5 w-3.5" /> Pauza
        </button>
      </div>

      <div className="mt-2 flex items-center gap-1">
        <span className="mr-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Prędkość</span>
        {SPEEDS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSpeed(value)}
            className={cn(
              "flex-1 rounded-md py-1 font-mono text-[10px] font-semibold transition-colors",
              speed === value
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            x{value}
          </button>
        ))}
      </div>
    </div>
  );
}

function LivePanel({ liveCount }) {
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 px-3 py-2.5">
        <Radio className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-[12px] font-semibold leading-tight">
            {liveCount > 0 ? `${liveCount} pojazdów nadaje pozycję` : "Oczekiwanie na dane GPS"}
          </p>
          <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
            Tryb gotowy na odbiór współrzędnych z webhooka.
          </p>
        </div>
      </div>
      <p className="mt-2 font-mono text-[9.5px] leading-relaxed text-muted-foreground">
        POST /api/gps<br />
        {"{ fleet_number, lat, lng, line }"}
      </p>
    </div>
  );
}

export default function MapControls({
  onStart,
  onPause,
  activeCount = 0,
  liveCount = 0,
  dayHasCourses = true,
}) {
  const { mode } = useSimulation();

  return (
    <div className="absolute left-2 top-2 z-[600] w-[calc(100%-1rem)] max-w-[286px] rounded-2xl border border-border/70 bg-card/95 p-3 shadow-[0_26px_60px_-34px_rgba(18,26,43,0.75)] backdrop-blur-xl sm:left-4 sm:top-4">
      <ModeToggle />
      {mode === "sim" ? (
        <SimulationPanel
          onStart={onStart}
          onPause={onPause}
          activeCount={activeCount}
          dayHasCourses={dayHasCourses}
        />
      ) : (
        <LivePanel liveCount={liveCount} />
      )}
    </div>
  );
}
