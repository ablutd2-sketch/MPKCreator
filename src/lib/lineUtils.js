export function isNightLine(line) {
  if (!line) return false;
  return Boolean(line.night);
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
    const names = list.map((stop) => String(stop.name).trim());
    let turnaround = last;
    for (let i = 1; i < names.length; i += 1) {
      if (names.slice(0, i).includes(names[i])) {
        turnaround = list[i - 1];
        break;
      }
    }
    return `${names[0]} → ${String(turnaround.name).trim()}`;
  }

  return `${String(first.name).trim()} → ${String(last.name).trim()}`;
}

export const ASSIGNMENT_MODE_LABELS = {
  manual: "Ręczny przydział",
  model: "Wybrany model",
  percentage: "Udziały procentowe",
};
