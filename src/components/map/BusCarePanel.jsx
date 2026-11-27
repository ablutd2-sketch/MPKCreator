import { useEffect, useMemo, useState } from "react";
import { Apple, Bed, Droplets, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import StatBar from "@/components/fleet/StatBar";
import { FATIGUE_LIMIT, wakeFatigueValue, wakeHungerValue, wakeThirstValue } from "@/lib/fatigue";
import { useSimulation } from "@/lib/SimulationContext";
import { useTransitData } from "@/lib/useTransitData";
import { cn } from "@/lib/utils";

const ACTIONS = {
  feed: { label: "Nakarm", noun: "Karmienie", max: 5, Icon: Apple },
  drink: { label: "Napój", noun: "Napój", max: 3, Icon: Droplets },
};

// Zadowolenie rośnie losowo: karmienie do +5%, napój do +3%,
// z szansą, że nic nie pomoże (0%).
function rollGain(max) {
  if (Math.random() < 0.2) return 0;
  return Math.round((0.2 + Math.random() * (max - 0.2)) * 10) / 10;
}

const satisfactionOf = (item) => Math.round(Number(item?.satisfaction ?? item?.vehicle?.satisfaction ?? 100));

export default function BusCarePanel({ items = [] }) {
  const { simMinutes } = useSimulation();
  const { reload } = useTransitData();
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const ids = useMemo(() => items.map((item) => item.vehicle.id), [items]);

  useEffect(() => {
    if (!ids.length) {
      setSelected("");
      return;
    }
    if (!ids.includes(selected)) setSelected(ids[0]);
  }, [ids, selected]);

  if (!items.length) return null;

  const current = items.find((item) => item.vehicle.id === selected) || items[0];

  const act = async (kind) => {
    if (saving) return;
    const { max } = ACTIONS[kind];
    const gain = rollGain(max);
    setSaving(true);
    try {
      const base = Number(current.satisfaction ?? current.vehicle.satisfaction ?? 100);
      const next = Math.min(100, Math.round((base + gain) * 10) / 10);
      const patch = { satisfaction: next };
      if (kind === "feed") patch.hunger = wakeHungerValue(current.vehicle, simMinutes);
      if (kind === "drink") patch.thirst = wakeThirstValue(current.vehicle, simMinutes);
      await base44.entities.Vehicle.update(current.vehicle.id, patch);
      setResult({ kind, gain, max, ok: gain > 0 });
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const toggleSpa = async () => {
    if (saving) return;
    const next = !current.vehicle.depot_sleep;
    setSaving(true);
    try {
      await base44.entities.Vehicle.update(
        current.vehicle.id,
        next ? { depot_sleep: true, fatigue: 0 } : { depot_sleep: false, fatigue: wakeFatigueValue(current.vehicle, simMinutes) }
      );
      setResult(null);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const filled = result ? Math.min(100, (result.gain / result.max) * 100) : 0;
  const fatigue = Math.round(Number(current.fatigue ?? current.vehicle.fatigue ?? 0));
  const hunger = Math.round(Number(current.hunger ?? current.vehicle.hunger ?? 0));
  const thirst = Math.round(Number(current.thirst ?? current.vehicle.thirst ?? 0));
  const inDepot = Boolean(current.vehicle.depot_sleep);
  const asleep = inDepot || fatigue >= FATIGUE_LIMIT;

  return (
    <div className="absolute bottom-4 right-3 z-[600] w-[248px] max-w-[calc(100%-1.5rem)] overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-[0_26px_60px_-34px_rgba(18,26,43,0.75)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
        <span className="eyebrow">Opieka nad taborem</span>
        <span className="num text-[10px] font-semibold text-foreground">{satisfactionOf(current)}%</span>
      </div>

      <div className="space-y-2 p-2.5">
        <select
          value={current.vehicle.id}
          onChange={(event) => {
            setSelected(event.target.value);
            setResult(null);
          }}
          aria-label="Wybierz autobus"
          className="h-8 w-full rounded-lg border border-border bg-card px-2 text-[11px] font-medium text-foreground outline-none focus:border-primary"
        >
          {items.map((item) => (
            <option key={item.vehicle.id} value={item.vehicle.id}>
              {item.line?.number ? `${item.line.number} · ` : ""}
              {item.vehicle.fleet_number} · {satisfactionOf(item)}%
            </option>
          ))}
        </select>

        <div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Zmęczenie</span>
            <span className={cn("num font-semibold", asleep ? "text-destructive" : "text-foreground")}>{fatigue}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                asleep ? "bg-destructive" : fatigue >= 50 ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${Math.min(100, fatigue)}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <StatBar label="Głód" value={hunger} />
          <StatBar label="Pragnienie" value={thirst} />
        </div>

        <div className="flex gap-1.5">
          {Object.entries(ACTIONS).map(([kind, action]) => (
            <button
              key={kind}
              type="button"
              onClick={() => act(kind)}
              disabled={saving}
              className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-[11.5px] font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <action.Icon className="h-3.5 w-3.5" />}
              {action.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleSpa}
          disabled={saving}
          className={cn(
            "flex h-7 w-full items-center justify-center gap-1.5 rounded-lg border text-[11px] font-semibold transition-colors disabled:opacity-50",
            inDepot
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-secondary"
          )}
        >
          <Bed className="h-3.5 w-3.5" />
          {inDepot ? "Obudź w zajezdni" : "Połóż spać w zajezdni"}
        </button>

        <div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn("h-full rounded-full transition-all", result?.ok ? "bg-emerald-500" : "bg-destructive")}
              style={{ width: `${filled}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
            {inDepot
              ? "ŚPI W ZAJEDNI · odpoczywa"
              : asleep
                ? `ŚPI NA PĘTLI · zmęczenie od ${FATIGUE_LIMIT}%`
                : result
                  ? result.ok
                    ? `${ACTIONS[result.kind].noun}: +${result.gain.toFixed(1).replace(".", ",")}% z ${result.max}%`
                    : `Nie udało się — 0% z ${result.max}%`
                  : "Karmienie daje do +5%, napój do +3% zadowolenia."}
          </p>
        </div>
      </div>
    </div>
  );
}
