export const FLOOR_OPTIONS = [
  {
    value: "low",
    label: "Niskopodłogowy",
    short: "niskopodłogowy",
    chip: "bg-emerald-100 text-emerald-900 border-emerald-300",
    dot: "bg-emerald-400",
  },
  {
    value: "low_entry",
    label: "Niskowejściowy",
    short: "niskowejściowy",
    chip: "bg-amber-100 text-amber-900 border-amber-300",
    dot: "bg-amber-400",
  },
  {
    value: "high",
    label: "Wysokopodłogowy",
    short: "wysokopodłogowy",
    chip: "bg-rose-100 text-rose-900 border-rose-300",
    dot: "bg-rose-400",
  },
  {
    value: "unknown",
    label: "Brak informacji",
    short: "brak informacji",
    chip: "bg-slate-200 text-slate-700 border-slate-300",
    dot: "bg-slate-400",
  },
];

const BY_VALUE = new Map(FLOOR_OPTIONS.map((option) => [option.value, option]));

export function floorMeta(value) {
  return BY_VALUE.get(value) || BY_VALUE.get("unknown");
}

export const KIND_OPTIONS = [
  { value: "bus", label: "Autobus" },
  { value: "tram", label: "Tramwaj" },
];
