import L from "leaflet";
import { isNightLine } from "@/lib/lineUtils";

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char];
  });

const BUS_GLYPH = `<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.92)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M4 17V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11"/><path d="M4 12h16"/><path d="M7 17h10"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/></svg>`;

export function busIcon(item) {
  const label = escapeHtml(item?.line?.number || "–");
  const imageUrl = item?.vehicle?.image_url;
  const night = isNightLine(item?.line);

  const media = imageUrl
    ? `<img class="bus-marker__img" src="${escapeHtml(imageUrl)}" alt="" />`
    : `<div class="bus-marker__fallback">${BUS_GLYPH}</div>`;

  const badgeStyle = night
    ? "background:#000000;color:#ffffff;border-color:#000000;"
    : "background:#ffffff;color:#000000;border-color:#000000;";

  const html = `<div class="bus-marker-shell">
      <div class="bus-marker">${media}</div>
      <span class="bus-marker__line" style="${badgeStyle}">${label}</span>
    </div>`;

  return L.divIcon({
    html,
    className: "bus-marker-root",
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -22],
  });
}

export function stopIcon(label, variant = "mid") {
  const modifier =
    variant === "ghost" ? " stop-pin--ghost" : variant === "start" ? " stop-pin--start" : variant === "end" ? " stop-pin--end" : "";
  return L.divIcon({
    html: `<div class="stop-pin${modifier}">${escapeHtml(label)}</div>`,
    className: "stop-pin-root",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}
