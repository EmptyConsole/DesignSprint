import { useCallback, useEffect, useRef, useState } from "react";
import { CameraScreen } from "./components/CameraScreen";
import { AnalyzingScreen } from "./components/AnalyzingScreen";
import { ResultScreen } from "./components/ResultScreen";
import { ErrorScreen } from "./components/ErrorScreen";
import { LocationSheet } from "./components/LocationSheet";
import { HistorySheet } from "./components/HistorySheet";
import { classifyPhoto } from "./lib/api";
import { makeThumb } from "./lib/image";
import { locateByIp, locatePrecisely } from "./lib/location";
import * as store from "./lib/storage";
import type { ClassifyResponse, LocationInfo } from "./lib/types";

type Phase =
  | { name: "camera" }
  | { name: "analyzing"; photo: string; stage: Stage; guess?: string }
  | { name: "result"; photo: string; response: ClassifyResponse; locationLabel: string }
  | { name: "error"; photo: string; message: string };

export type Stage = "identify" | "verify";
export type LocStatus = "loading" | "ready" | "locating" | "error";

const UNKNOWN: LocationInfo = { source: "ip", label: "Unknown location" };

export default function App() {
  const [phase, setPhase] = useState<Phase>({ name: "camera" });
  const [sheet, setSheet] = useState<null | "location" | "history">(null);
  const [location, setLocation] = useState<LocationInfo | null>(() => store.loadLocation());
  const [locStatus, setLocStatus] = useState<LocStatus>(location && location.source !== "ip" ? "ready" : "loading");
  const [locError, setLocError] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(() => store.loadAdvanced());
  const [history, setHistory] = useState(() => store.loadHistory());

  const ipLookup = useRef<Promise<LocationInfo | null> | null>(null);
  const inflight = useRef<AbortController | null>(null);

  const applyLocation = useCallback((loc: LocationInfo) => {
    setLocation(loc);
    store.saveLocation(loc);
    setLocStatus("ready");
    setLocError(null);
  }, []);

  const refreshIpLocation = useCallback(() => {
    setLocStatus("loading");
    ipLookup.current = locateByIp()
      .then((loc) => {
        applyLocation(loc);
        return loc;
      })
      .catch(() => {
        setLocStatus("error");
        setLocError("Couldn't estimate your location. Set it so the rules are local.");
        return null;
      });
    return ipLookup.current;
  }, [applyLocation]);

  // Default: estimate from IP, unless the person already chose a place.
  useEffect(() => {
    if (!location || location.source === "ip") refreshIpLocation();
  }, []);

  const requestPrecise = useCallback(async () => {
    setLocStatus("locating");
    setLocError(null);
    try {
      applyLocation(await locatePrecisely());
      return true;
    } catch (err) {
      setLocStatus(location ? "ready" : "error");
      setLocError((err as Error).message);
      return false;
    }
  }, [applyLocation, location]);

  const toggleAdvanced = () => {
    setAdvanced((on) => {
      store.saveAdvanced(!on);
      return !on;
    });
  };

  const analyze = useCallback(
    async (photo: string) => {
      inflight.current?.abort();
      const ctrl = new AbortController();
      inflight.current = ctrl;
      setPhase({ name: "analyzing", photo, stage: "identify" });

      const loc = location ?? (await ipLookup.current) ?? UNKNOWN;
      try {
        let response = await classifyPhoto({ image: photo, location: loc, advanced }, ctrl.signal);
        if (ctrl.signal.aborted) return;
        // Not fully sure? Automatically double-check against live local sources.
        const r = response.result;
        if (!advanced && !r.unclear && r.confidence !== "high") {
          setPhase({ name: "analyzing", photo, stage: "verify", guess: r.item });
          try {
            response = await classifyPhoto({ image: photo, location: loc, advanced: true }, ctrl.signal);
          } catch {
            // Keep the fast answer if the double-check fails.
          }
          if (ctrl.signal.aborted) return;
        }
        setPhase({ name: "result", photo, response, locationLabel: loc.label });
        if (!response.result.unclear) {
          const thumb = await makeThumb(photo).catch(() => "");
          setHistory(
            store.addHistory({ id: crypto.randomUUID(), ts: Date.now(), thumb, location: loc.label, response }),
          );
        }
      } catch (err) {
        if (ctrl.signal.aborted) return;
        setPhase({ name: "error", photo, message: (err as Error).message });
      }
    },
    [location, advanced],
  );

  const backToCamera = () => {
    inflight.current?.abort();
    setPhase({ name: "camera" });
  };

  return (
    <div className="app">
      {phase.name === "camera" && (
        <CameraScreen
          location={location}
          locStatus={locStatus}
          advanced={advanced}
          historyThumb={history[0]?.thumb}
          onToggleAdvanced={toggleAdvanced}
          onOpenLocation={() => setSheet("location")}
          onPrecise={requestPrecise}
          onOpenHistory={() => setSheet("history")}
          onPhoto={analyze}
        />
      )}
      {phase.name === "analyzing" && (
        <AnalyzingScreen
          photo={phase.photo}
          location={location}
          advanced={advanced}
          stage={phase.stage}
          guess={phase.guess}
          onCancel={backToCamera}
        />
      )}
      {phase.name === "result" && (
        <ResultScreen
          photo={phase.photo}
          response={phase.response}
          locationLabel={phase.locationLabel}
          onDone={backToCamera}
        />
      )}
      {phase.name === "error" && (
        <ErrorScreen
          photo={phase.photo}
          message={phase.message}
          onRetry={() => analyze(phase.photo)}
          onBack={backToCamera}
        />
      )}

      {sheet === "location" && (
        <LocationSheet
          location={location}
          status={locStatus}
          error={locError}
          onClose={() => setSheet(null)}
          onPrecise={async () => {
            if (await requestPrecise()) setSheet(null);
          }}
          onManual={(loc) => {
            applyLocation(loc);
            setSheet(null);
          }}
          onAutomatic={async () => {
            if (await refreshIpLocation()) setSheet(null);
          }}
        />
      )}
      {sheet === "history" && (
        <HistorySheet
          entries={history}
          onClose={() => setSheet(null)}
          onClear={() => setHistory(store.clearHistory())}
          onOpen={(e) => {
            setSheet(null);
            setPhase({ name: "result", photo: e.thumb, response: e.response, locationLabel: e.location });
          }}
        />
      )}
    </div>
  );
}
