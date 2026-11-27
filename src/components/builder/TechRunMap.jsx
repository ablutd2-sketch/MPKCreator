import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, Rectangle, Tooltip, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import BaseTileLayer from "@/components/map/BaseTileLayer";
import MapSearch from "@/components/map/MapSearch";
import { POLAND_CENTER, POLAND_ZOOM } from "@/lib/mapConfig";
import { areaBounds } from "@/lib/techRun";

function ClickPick({ onPick }) {
  useMapEvents({
    click(event) {
      onPick?.(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function Fit({ fitKey, area, draftCorner, start, end, path }) {
  const map = useMap();

  useEffect(() => {
    const points = [];
    if (area) points.push([area.south, area.west], [area.north, area.east]);
    [draftCorner, start, end, ...(path || [])].forEach((point) => {
      if (point) points.push([Number(point.lat), Number(point.lng)]);
    });
    const valid = points.filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
    if (!valid.length) return;
    if (valid.length === 1) map.setView(valid[0], 14);
    else map.fitBounds(L.latLngBounds(valid), { padding: [30, 30], maxZoom: 16 });
  }, [fitKey]);

  return null;
}

export default function TechRunMap({ area, draftCorner, start, end, path = [], onPick, fitKey }) {
  const anchor = start || end || draftCorner || null;
  const center = anchor ? [Number(anchor.lat), Number(anchor.lng)] : POLAND_CENTER;
  const zoom = anchor ? 13 : POLAND_ZOOM;

  return (
    <MapContainer center={center} zoom={zoom} zoomControl={false} className="h-full w-full" scrollWheelZoom>
      <BaseTileLayer />
      <MapSearch />
      <ClickPick onPick={onPick} />
      <Fit fitKey={fitKey} area={area} draftCorner={draftCorner} start={start} end={end} path={path} />

      {area && (
        <Rectangle
          bounds={areaBounds(area)}
          pathOptions={{ color: "#1B4DB1", weight: 1.5, dashArray: "6 6", fillOpacity: 0.05 }}
        />
      )}

      {path.length > 1 && (
        <Polyline
          positions={path.map((point) => [point.lat, point.lng])}
          pathOptions={{ color: "#C8102E", weight: 4, opacity: 0.95, lineCap: "round" }}
        />
      )}

      {draftCorner && (
        <CircleMarker
          center={[Number(draftCorner.lat), Number(draftCorner.lng)]}
          radius={5}
          pathOptions={{ color: "#B26A00", weight: 2, fillColor: "#ffffff", fillOpacity: 1 }}
        >
          <Tooltip direction="top" offset={[0, -6]}>Narożnik obszaru</Tooltip>
        </CircleMarker>
      )}

      {start && (
        <CircleMarker
          center={[Number(start.lat), Number(start.lng)]}
          radius={7}
          pathOptions={{ color: "#0F7A5A", weight: 2, fillColor: "#0F7A5A", fillOpacity: 1 }}
        >
          <Tooltip direction="top" offset={[0, -8]}>Początek przejazdu</Tooltip>
        </CircleMarker>
      )}

      {end && (
        <CircleMarker
          center={[Number(end.lat), Number(end.lng)]}
          radius={7}
          pathOptions={{ color: "#14223B", weight: 2, fillColor: "#14223B", fillOpacity: 1 }}
        >
          <Tooltip direction="top" offset={[0, -8]}>Koniec przejazdu</Tooltip>
        </CircleMarker>
      )}

      <ZoomControl position="bottomright" />
    </MapContainer>
  );
}
