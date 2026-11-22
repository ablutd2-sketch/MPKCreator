export function parseStopsFile(text) {
  const rows = String(text || "")
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);
  if (!rows.length) return [];

  const split = (row) =>
    row
      .split(/[,;\t]/)
      .map((cell) => cell.replace(/^"|"$/g, "").trim());

  const header = split(rows[0]).map((cell) => cell.toLowerCase());
  const find = (...names) => header.findIndex((cell) => names.includes(cell));

  const latIndex = find("stop_lat", "lat", "latitude", "szerokosc");
  const lngIndex = find("stop_lon", "stop_lng", "lon", "lng", "longitude", "dlugosc");
  const nameIndex = find("stop_name", "name", "nazwa");
  const hasHeader = latIndex >= 0 && lngIndex >= 0;

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const columns = hasHeader
    ? { lat: latIndex, lng: lngIndex, name: nameIndex }
    : { lat: 1, lng: 2, name: 0 };

  const stops = [];
  dataRows.forEach((row, index) => {
    const cells = split(row);
    const lat = Number(cells[columns.lat]);
    const lng = Number(cells[columns.lng]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
    stops.push({
      name: (columns.name >= 0 ? cells[columns.name] : "") || `Przystanek ${index + 1}`,
      lat,
      lng,
    });
  });

  return stops;
}
