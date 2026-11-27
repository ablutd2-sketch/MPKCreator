import { cn } from "@/lib/utils";

const toneFor = (pct, invert) => {
  if (invert) return pct <= 40 ? "bg-destructive" : pct <= 70 ? "bg-amber-500" : "bg-emerald-500";
  return pct >= 70 ? "bg-destructive" : pct >= 40 ? "bg-amber-500" : "bg-emerald-500";
};

export default function StatBar({ label, value, invert = false, className }) {
  const pct = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const bad = invert ? pct <= 40 : pct >= 70;
  return (
    <span className={cn("block", className)}>
      <span className="flex items-center justify-between gap-2 text-[9.5px] text-muted-foreground">
        <span>{label}</span>
        <span className={cn("num font-semibold", bad ? "text-destructive" : "text-foreground")}>{pct}%</span>
      </span>
      <span className="mt-0.5 block h-1 w-full overflow-hidden rounded-full bg-secondary">
        <span className={cn("block h-full rounded-full transition-all", toneFor(pct, invert))} style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}
