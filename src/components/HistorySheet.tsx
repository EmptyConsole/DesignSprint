import { Sheet } from "./Sheet";
import { CATEGORY } from "../lib/categories";
import type { HistoryEntry } from "../lib/storage";

interface Props {
  entries: HistoryEntry[];
  onClose: () => void;
  onClear: () => void;
  onOpen: (entry: HistoryEntry) => void;
}

function timeAgo(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function HistorySheet({ entries, onClose, onClear, onOpen }: Props) {
  return (
    <Sheet title="Recent scans" onClose={onClose}>
      {entries.length === 0 ? (
        <p className="sheet-lead">Nothing yet. Your last 12 scans will show up here, saved only on this device.</p>
      ) : (
        <>
          <ul className="history">
            {entries.map((e) => {
              const r = e.response.result;
              const c = CATEGORY[r.category];
              return (
                <li key={e.id}>
                  <button onClick={() => onOpen(e)}>
                    {e.thumb ? <img src={e.thumb} alt="" /> : <span className="thumb-ph" />}
                    <div>
                      <strong>{r.item}</strong>
                      <span>
                        {e.location} · {timeAgo(e.ts)}
                      </span>
                    </div>
                    <span className={`pill cat-${r.category}`}>
                      <c.Icon size={14} /> {r.category === "special" ? (r.special?.headline ?? c.label) : c.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button className="link-btn" onClick={onClear}>
            Clear history
          </button>
        </>
      )}
    </Sheet>
  );
}
