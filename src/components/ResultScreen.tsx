import { useRef } from "react";
import {
  ArrowLeft,
  Ban,
  BookOpen,
  Camera,
  ChevronDown,
  Earth,
  ExternalLink,
  Hand,
  Info,
  Lightbulb,
  MapPin,
  ScanSearch,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { CATEGORY } from "../lib/categories";
import type { Classification, ClassifyResponse, Confidence } from "../lib/types";

interface Props {
  photo: string;
  response: ClassifyResponse;
  locationLabel: string;
  onDone: () => void;
}

export function ResultScreen({ photo, response, locationLabel, onDone }: Props) {
  const r = response.result;
  const detailsRef = useRef<HTMLElement>(null);

  if (r.unclear) return <UnclearResult photo={photo} tip={r.retakeTip} onDone={onDone} />;

  const cat = CATEGORY[r.category];
  const special = r.category === "special" ? r.special : null;
  const BigIcon = cat.Icon;

  return (
    <section className={`result cat-${r.category}`}>
      <div className="result-scroll">
        <nav className="result-nav">
          <button className="icon-btn" onClick={onDone} aria-label="Back to camera">
            <ArrowLeft size={20} />
          </button>
          <span className="nav-loc">
            <MapPin size={14} /> {locationLabel} rules
          </span>
        </nav>

        <article className="hero">
          <BigIcon className="hero-watermark" aria-hidden strokeWidth={1.5} />
          {special && <div className="hazard-band">Don't put this in any bin</div>}

          <div className="hero-item">
            <img src={photo} alt="" />
            <div>
              <strong>{r.item}</strong>
              <span>{r.material}</span>
            </div>
          </div>

          <div className="hero-verdict">
            <span className="hero-eyebrow">
              <BigIcon size={18} strokeWidth={2.4} /> {special ? "Special handling" : `Goes in the ${cat.bin.toLowerCase()}`}
            </span>
            <h1 className={`hero-word ${special ? "long" : ""}`}>{special ? special.headline : cat.label}</h1>
            <p className="hero-where">in {locationLabel}</p>
          </div>

          <p className="hero-reason">{r.reason}</p>

          <div className="hero-meta">
            <ConfidenceBadge level={r.confidence} />
            {response.advanced && (
              <span className="badge">
                <Sparkles size={13} /> Checked live
              </span>
            )}
          </div>
        </article>

        {special && <SpecialBox special={special} />}

        {r.steps.length > 0 && (
          <section className="block">
            <h3>Before you toss it</h3>
            <ol className="steps">
              {r.steps.map((s, i) => (
                <li key={i}>
                  <span className="step-n">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </section>
        )}

        {r.parts.length > 0 && (
          <section className="block">
            <h3>Split it up</h3>
            <ul className="parts">
              {r.parts.map((part, i) => {
                const pc = CATEGORY[part.category];
                return (
                  <li key={i}>
                    <div>
                      <strong>{part.part}</strong>
                      {part.note && <span>{part.note}</span>}
                    </div>
                    <span className={`pill cat-${part.category}`}>
                      <pc.Icon size={14} /> {pc.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {r.confidence === "low" && (
          <p className="note">
            <Info size={16} /> This one's a best guess. When in doubt, check your city's waste guide — or keep it out
            of recycling so it doesn't contaminate the batch.
          </p>
        )}

        <button
          className="more-btn"
          onClick={() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          More details <ChevronDown size={16} />
        </button>

        <section className="details" ref={detailsRef} aria-label="Details">
          <Details d={r.details} />
          {response.sources.length > 0 && (
            <div className="sources">
              <h4>Sources checked</h4>
              <ul>
                {response.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.title} <ExternalLink size={12} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="fineprint">
            AI-generated guidance for {locationLabel}. Rules change — your local hauler has the final word.
          </p>
        </section>
      </div>

      <footer className="result-actions">
        <button className="btn btn-primary wide" onClick={onDone}>
          <Camera size={18} /> Scan another
        </button>
      </footer>
    </section>
  );
}

const CONFIDENCE: Record<Confidence, string> = {
  high: "Confident",
  medium: "Fairly sure",
  low: "Best guess",
};

function ConfidenceBadge({ level }: { level: Confidence }) {
  return (
    <span className={`badge conf-${level}`}>
      <span className="conf-bars" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      {CONFIDENCE[level]}
    </span>
  );
}

function SpecialBox({ special }: { special: NonNullable<Classification["special"]> }) {
  return (
    <section className="block special-box">
      <h3>Where to take it</h3>
      <div className="special-row">
        <MapPin size={18} />
        <p>{special.where}</p>
      </div>
      <div className="special-row">
        <Hand size={18} />
        <p>{special.how}</p>
      </div>
      {special.warning && (
        <div className="special-row warn">
          <ShieldAlert size={18} />
          <p>{special.warning}</p>
        </div>
      )}
    </section>
  );
}

function Details({ d }: { d: Classification["details"] }) {
  const tiles = [
    { label: "Local rule", text: d.localRule, Icon: BookOpen },
    { label: "Why it matters", text: d.whyItMatters, Icon: Earth },
    { label: "Common mistake", text: d.commonMistake, Icon: Ban },
    { label: "Better next time", text: d.betterAlternative, Icon: Lightbulb },
  ];
  return (
    <div className="tiles">
      {tiles.map(({ label, text, Icon }) => (
        <div className="tile" key={label}>
          <span className="tile-icon">
            <Icon size={16} />
          </span>
          <h4>{label}</h4>
          <p>{text}</p>
        </div>
      ))}
    </div>
  );
}

function UnclearResult({ photo, tip, onDone }: { photo: string; tip: string | null; onDone: () => void }) {
  return (
    <section className="result cat-unclear">
      <div className="result-scroll">
        <nav className="result-nav">
          <button className="icon-btn" onClick={onDone} aria-label="Back to camera">
            <ArrowLeft size={20} />
          </button>
        </nav>
        <article className="hero">
          <ScanSearch className="hero-watermark" aria-hidden strokeWidth={1.5} />
          <div className="hero-item">
            <img src={photo} alt="" />
          </div>
          <div className="hero-verdict">
            <h1 className="hero-word long">Hmm, can't tell</h1>
          </div>
          <p className="hero-reason">{tip || "Try one item, centered, in good light."}</p>
        </article>
      </div>
      <footer className="result-actions">
        <button className="btn btn-primary wide" onClick={onDone}>
          <Camera size={18} /> Retake photo
        </button>
      </footer>
    </section>
  );
}
