import { useEffect, useRef, useState } from "react";
import { ChevronDown, History, ImagePlus, LoaderCircle, LocateFixed, MapPin, Sparkles, Zap } from "lucide-react";
import { Logo } from "./Logo";
import { captureVideoFrame, fileToDataUrl } from "../lib/image";
import type { LocationInfo } from "../lib/types";
import type { LocStatus } from "../App";

type CamState = "starting" | "live" | "blocked" | "insecure" | "unavailable";

interface Props {
  location: LocationInfo | null;
  locStatus: LocStatus;
  advanced: boolean;
  historyThumb?: string;
  onToggleAdvanced: () => void;
  onOpenLocation: () => void;
  onPrecise: () => void;
  onOpenHistory: () => void;
  onPhoto: (dataUrl: string) => void;
}

const SOURCE_TAG = { ip: "approx", precise: "GPS", manual: "set" } as const;

export function CameraScreen(p: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cam, setCam] = useState<CamState>("starting");
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!window.isSecureContext) return setCam("insecure");
    if (!navigator.mediaDevices?.getUserMedia) return setCam("unavailable");

    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      .then(async (s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        const video = videoRef.current!;
        video.srcObject = s;
        await video.play().catch(() => {});
        setCam("live");
      })
      .catch((err: DOMException) => setCam(err.name === "NotAllowedError" ? "blocked" : "unavailable"));

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const shoot = () => {
    const video = videoRef.current;
    if (cam !== "live" || !video?.videoWidth) return fileRef.current?.click();
    setFlash(true);
    const photo = captureVideoFrame(video);
    setTimeout(() => p.onPhoto(photo), 160);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) p.onPhoto(await fileToDataUrl(file));
  };

  const locating = p.locStatus === "loading" || p.locStatus === "locating";
  const locLabel = p.location?.label ?? (locating ? "Finding you…" : "Set location");

  return (
    <section className="camera">
      <video ref={videoRef} className={`camera-feed ${cam === "live" ? "on" : ""}`} playsInline muted autoPlay />
      {cam !== "live" && cam !== "starting" && <NoCamera state={cam} onPick={() => fileRef.current?.click()} />}
      {flash && <div className="flash" />}

      <header className="camera-top">
        <Logo />
        <div className="loc-group">
          <button className="loc-chip" onClick={p.onOpenLocation} aria-label={`Location: ${locLabel}. Change`}>
            <MapPin size={15} strokeWidth={2.4} />
            <span className="loc-label">{locLabel}</span>
            {p.location && <span className="loc-tag">{SOURCE_TAG[p.location.source]}</span>}
            <ChevronDown size={14} className="loc-caret" />
          </button>
          <button
            className="icon-btn glass"
            onClick={p.onPrecise}
            disabled={locating}
            aria-label="Use my precise location"
            title="Use my precise location"
          >
            {p.locStatus === "locating" ? <LoaderCircle size={18} className="spin" /> : <LocateFixed size={18} />}
          </button>
        </div>
      </header>

      {cam === "live" && (
        <div className="reticle" aria-hidden>
          <i /> <i /> <i /> <i />
          <p className="reticle-hint">Point at one item</p>
        </div>
      )}

      <footer className="camera-bottom">
        <button
          role="switch"
          aria-checked={p.advanced}
          className={`mode-toggle ${p.advanced ? "on" : ""}`}
          onClick={p.onToggleAdvanced}
        >
          <span className="mode-opt fast">
            <Zap size={14} /> Fast
          </span>
          <span className="mode-opt adv">
            <Sparkles size={14} /> Advanced
          </span>
          <span className="mode-thumb" />
        </button>
        <p className="mode-help">
          {p.advanced ? "Checks official local sources · slower" : "Instant answer from local knowledge"}
        </p>

        <div className="dock">
          <button className="dock-btn" onClick={() => fileRef.current?.click()} aria-label="Upload a photo">
            <ImagePlus size={22} />
          </button>
          <button className="shutter" onClick={shoot} aria-label="Take photo and sort">
            <span />
          </button>
          <button className="dock-btn" onClick={p.onOpenHistory} aria-label="Recent scans">
            {p.historyThumb ? <img src={p.historyThumb} alt="" /> : <History size={22} />}
          </button>
        </div>
      </footer>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
    </section>
  );
}

function NoCamera({ state, onPick }: { state: CamState; onPick: () => void }) {
  const msg =
    state === "blocked"
      ? "Camera access is off. Allow it in your browser settings, or snap a photo instead."
      : state === "insecure"
        ? "Live camera needs a secure (HTTPS) connection. You can still snap or upload a photo."
        : "No live camera here. Snap or upload a photo of the item instead.";
  return (
    <div className="no-camera">
      <div className="no-camera-art" aria-hidden>
        <span className="b recycling" />
        <span className="b compost" />
        <span className="b trash" />
        <span className="b special" />
      </div>
      <h2>What are you tossing?</h2>
      <p>{msg}</p>
      <button className="btn btn-light" onClick={onPick}>
        <ImagePlus size={18} /> Snap or upload a photo
      </button>
    </div>
  );
}
