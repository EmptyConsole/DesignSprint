import { useState } from "react";
import { LoaderCircle, LocateFixed, MapPin, Wifi } from "lucide-react";
import { Sheet } from "./Sheet";
import { manualLocation } from "../lib/location";
import type { LocationInfo } from "../lib/types";
import type { LocStatus } from "../App";

interface Props {
  location: LocationInfo | null;
  status: LocStatus;
  error: string | null;
  onClose: () => void;
  onPrecise: () => void;
  onManual: (loc: LocationInfo) => void;
  onAutomatic: () => void;
}

const SOURCE_TEXT = {
  ip: "Estimated from your internet connection — can be off by a town or two.",
  precise: "From your device's GPS.",
  manual: "Set by you.",
} as const;

export function LocationSheet({ location, status, error, onClose, onPrecise, onManual, onAutomatic }: Props) {
  const [text, setText] = useState(location?.source === "manual" ? location.label : "");
  const busy = status === "loading" || status === "locating";

  return (
    <Sheet title="Whose rules?" onClose={onClose}>
      <p className="sheet-lead">Recycling rules change from city to city, so Sortly needs to know where you'll toss it.</p>

      <div className="loc-current">
        <MapPin size={20} />
        <div>
          <strong>{location?.label ?? (busy ? "Finding you…" : "Not set")}</strong>
          {location && <span>{SOURCE_TEXT[location.source]}</span>}
        </div>
      </div>

      <button className="btn btn-primary wide" onClick={onPrecise} disabled={busy}>
        {status === "locating" ? <LoaderCircle size={18} className="spin" /> : <LocateFixed size={18} />}
        Use my precise location
      </button>

      <div className="or">or type a place</div>

      <form
        className="loc-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) onManual(manualLocation(text));
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="City, or ZIP / postal code"
          aria-label="City, or ZIP / postal code"
          autoComplete="address-level2"
          enterKeyHint="done"
        />
        <button className="btn btn-dark" type="submit" disabled={!text.trim()}>
          Save
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}

      {location?.source !== "ip" && (
        <button className="link-btn" onClick={onAutomatic} disabled={busy}>
          {status === "loading" ? <LoaderCircle size={14} className="spin" /> : <Wifi size={14} />} Go back to
          automatic estimate
        </button>
      )}
    </Sheet>
  );
}
