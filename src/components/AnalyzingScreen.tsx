import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { LocationInfo } from "../lib/types";
import type { Stage } from "../App";

interface Props {
  photo: string;
  location: LocationInfo | null;
  advanced: boolean;
  stage: Stage;
  guess?: string;
  onCancel: () => void;
}

export function AnalyzingScreen({ photo, location, advanced, stage, guess, onCancel }: Props) {
  const place = location?.city || location?.label || "local";
  const searching = advanced || stage === "verify";
  const steps = [
    "Identifying the item",
    `Checking ${place} rules`,
    ...(searching ? ["Searching official local sources"] : []),
    "Writing your answer",
  ];

  // Elapsed time within the current stage drives the (estimated) progress.
  const [t, setT] = useState(0);
  useEffect(() => {
    setT(0);
    const start = Date.now();
    const id = setInterval(() => setT((Date.now() - start) / 1000), 150);
    return () => clearInterval(id);
  }, [stage]);

  let active: number;
  let progress: number;
  if (stage === "verify") {
    active = 2;
    progress = 0.45 + 0.5 * (1 - Math.exp(-t / 9));
  } else {
    active = t < 1.8 ? 0 : searching && t > 5 ? 2 : 1;
    progress = 0.9 * (1 - Math.exp(-t / (searching ? 9 : 3.5)));
  }

  return (
    <section className="analyzing">
      <img className="frozen" src={photo} alt="Your photo" />
      <div className="reticle scanning" aria-hidden>
        <i /> <i /> <i /> <i />
        <span className="scanline" />
      </div>
      <button className="icon-btn glass cancel" onClick={onCancel} aria-label="Cancel">
        <X size={20} />
      </button>

      <div className="analyzing-panel" role="status" aria-live="polite">
        {stage === "verify" && (
          <p className="verify-note">
            Looks like <strong>{guess}</strong> — not 100% sure, double-checking local rules…
          </p>
        )}
        <ol className="checklist">
          {steps.map((s, i) => {
            const state = i < active ? "done" : i === active ? "active" : "todo";
            return (
              <li key={s} className={state}>
                <span className="check">{state === "done" ? <Check size={13} strokeWidth={3} /> : null}</span>
                {s}
              </li>
            );
          })}
        </ol>
        <div className="progress" aria-hidden>
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>
    </section>
  );
}
