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
  const first = list[0];
  const last = list[list.length - 1];
  const span = (a, b) => Math.hypot(Number(a.lat) - Number(b.lat), Number(a.lng) - Number(b.lng));

  // Linia okrężna: kierunek to start i najdalszy punkt trasy, nie powtórzony start.
  if (list.length > 2 && span(first, last) < 0.002) {
    const turnaround = list.slice(0, -1).reduce((best, stop) => (span(first, stop) > span(first, best) ? stop : best), first);
    return `${String(first.name).trim()} → ${String(turnaround.name).trim()}`;
  }

  return `${String(first.name).trim()} → ${String(last.name).trim()}`;
}

export const ASSIGNMENT_MODE_LABELS = {
  manual: "Ręczny przydział",
  model: "Wybrany model",
  percentage: "Udziały procentowe",
};
