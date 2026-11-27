export const FLOOR_OPTIONS = [
  {
    value: "low",
    label: "Niskopodłogowy",
    short: "niskopodłogowy",
    chip: "bg-[#C8E6C9]",
    dot: "bg-[#C8E6C9]",
  },
  {
    value: "low_entry",
    label: "Niskowejściowy",
    short: "niskowejściowy",
    chip: "bg-[#FFF9C4]",
    dot: "bg-[#FFF9C4]",
  },
  {
    value: "high",
    label: "Wysokopodłogowy",
    short: "wysokopodłogowy",
    chip: "bg-[#F8BBD0]",
    dot: "bg-[#F8BBD0]",
  },
  {
    value: "unknown",
    label: "Brak informacji",
    short: "brak informacji",
    chip: "bg-[#E0E0E0]",
    dot: "bg-[#E0E0E0]",
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
