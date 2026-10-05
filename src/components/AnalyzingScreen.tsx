import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { LocationInfo } from "../lib/types";

interface Props {
  photo: string;
  location: LocationInfo | null;
  advanced: boolean;
  onCancel: () => void;
}

export function AnalyzingScreen({ photo, location, advanced, onCancel }: Props) {
  const place = location?.city || location?.label || "local";
  const steps = useMemo(
    () =>
      advanced
        ? [
            "Spotting the item…",
            "Reading the material…",
            `Searching ${place} guidance…`,
            "Checking official sources…",
            "Writing it up simply…",
          ]
        : ["Spotting the item…", "Reading the material…", `Checking ${place} rules…`, "Almost there…"],
    [advanced, place],
  );
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, steps.length - 1)), advanced ? 2600 : 1500);
    return () => clearInterval(t);
  }, [steps, advanced]);

  return (
    <section className="analyzing">
      <img className="frozen" src={photo} alt="Your photo" />
      <div className="reticle scanning" aria-hidden>
        <i /> <i /> <i /> <i />
        <span className="scanline" />
      </div>
      <div className="analyzing-status" role="status" aria-live="polite">
        <div className="dots" aria-hidden>
          <i className="recycling" />
          <i className="compost" />
          <i className="trash" />
          <i className="special" />
        </div>
        <p key={i} className="status-text">
          {steps[i]}
        </p>
        {advanced && <p className="status-sub">Advanced mode can take 10–20 seconds</p>}
      </div>
      <button className="icon-btn glass cancel" onClick={onCancel} aria-label="Cancel">
        <X size={20} />
      </button>
    </section>
  );
}
