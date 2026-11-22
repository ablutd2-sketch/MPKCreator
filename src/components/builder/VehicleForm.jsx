import { useRef, useState } from "react";
import { ImagePlus, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VehicleForm({ onSaved }) {
  const [fleetNumber, setFleetNumber] = useState("");
  const [model, setModel] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const pickFile = (event) => {
    const picked = event.target.files?.[0];
    if (!picked) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(picked.type)) {
      setError("Dodaj plik JPG, PNG lub WEBP.");
      return;
    }
    setError("");
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  const reset = () => {
    setFleetNumber("");
    setModel("");
    setFile(null);
    setPreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (event) => {
    event.preventDefault();
    const number = fleetNumber.trim();
    if (!number) {
      setError("Podaj numer taborowy, np. BUS01.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      let imageUrl = "";
      if (file) {
        const uploaded = await base44.integrations.Core.UploadPublicFile({ file });
        imageUrl = uploaded?.file_url || "";
      }
      await base44.entities.Vehicle.create({
        fleet_number: number,
        model: model.trim(),
        image_url: imageUrl,
      });
      toast.success("Pojazd dodany do taboru");
      reset();
      onSaved?.();
    } catch {
      setError("Nie udało się zapisać pojazdu. Spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="surface p-5">
      <p className="eyebrow">Nowy pojazd</p>
      <h2 className="mt-1.5 font-display text-2xl leading-none">Dodaj autobus</h2>

      <div className="mt-4 space-y-3">
        <div>
          <Label htmlFor="fleet-number" className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            ID / Numer taborowy
          </Label>
          <Input
            id="fleet-number"
            value={fleetNumber}
            onChange={(event) => setFleetNumber(event.target.value)}
            placeholder="np. BUS01"
            className="mt-1 h-10 font-mono text-[13px]"
          />
        </div>

        <div>
          <Label htmlFor="model" className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Model pojazdu
          </Label>
          <Input
            id="model"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="np. Solaris Urbino 18"
            className="mt-1 h-10 text-[13px]"
          />
        </div>

        <div>
          <Label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Dodaj ikonę / zdjęcie autobusu
          </Label>
          <div className="mt-1 flex items-center gap-3">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-secondary/60">
              {preview ? (
                <img src={preview} alt="Podgląd pojazdu" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
              )}
            </span>
            <div className="min-w-0">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={pickFile}
                className="block w-full text-[11px] text-muted-foreground file:mr-2 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-[11px] file:font-medium file:text-foreground"
              />
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">JPG, PNG lub WEBP. Zdjęcie trafia na mapę jako pinezka.</p>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-[11.5px] font-medium text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-[12.5px] font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {saving ? "Zapisuję…" : "Dodaj pojazd"}
      </button>
    </form>
  );
}
