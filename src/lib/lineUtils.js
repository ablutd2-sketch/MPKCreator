export function isNightNumber(number) {
  return /^[69]/.test(String(number || "").trim());
}

export function isNightLine(line) {
  if (!line) return false;
  return Boolean(line.night) || isNightNumber(line.number);
}

export function autoLineName(stops) {
  const list = Array.isArray(stops)
    ? stops.filter((stop) => String(stop?.name || "").trim().length > 0)
    : [];
  if (list.length < 2) return "";
  return `${String(list[0].name).trim()} → ${String(list[list.length - 1].name).trim()}`;
}

export const ASSIGNMENT_MODE_LABELS = {
  manual: "Ręczny przydział",
  model: "Wybrany model",
  percentage: "Udziały procentowe",
};
