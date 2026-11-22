import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { Loader2, MapPin, Search } from "lucide-react";
import { searchPlaces } from "@/lib/server-fns";

export default function MapSearch({ className = "" }) {
  const map = useMap();
  const boxRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return undefined;
    L.DomEvent.disableClickPropagation(node);
    L.DomEvent.disableScrollPropagation(node);
    return undefined;
  }, []);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 3) {
      setResults([]);
      setOpen(false);
      setBusy(false);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setBusy(true);
      setError("");
      try {
        const list = await searchPlaces({ data: { query: text } });
        if (cancelled) return;
        setResults(Array.isArray(list) ? list : []);
        setOpen(true);
      } catch {
        if (cancelled) return;
        setResults([]);
        setError("Nie udało się wyszukać miejsca.");
        setOpen(true);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const pick = (item) => {
    if (Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
      map.flyTo([item.lat, item.lng], 15, { duration: 1 });
    }
    setQuery(String(item.name || "").split(",").slice(0, 2).join(",").trim());
    setOpen(false);
  };

  return (
    <div ref={boxRef} className={`absolute right-3 top-3 z-[650] w-[min(296px,calc(100%-1.5rem))] ${className}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Szukaj miasta, wsi lub adresu"
          aria-label="Szukaj miejsca na mapie"
          className="h-9 w-full rounded-xl border border-border bg-card/95 pl-8 pr-8 text-[12px] text-foreground shadow-[0_18px_40px_-24px_rgba(18,26,43,0.8)] outline-none backdrop-blur focus:border-primary"
        />
        {busy && (
          <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && (results.length > 0 || error) && (
        <ul className="mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-border bg-card/98 p-1 shadow-[0_24px_50px_-26px_rgba(18,26,43,0.85)] backdrop-blur">
          {error && <li className="px-2 py-2 text-[11px] text-muted-foreground">{error}</li>}
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => pick(item)}
                className="flex w-full items-start gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-secondary"
              >
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2 text-[11.5px] leading-snug text-foreground">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
