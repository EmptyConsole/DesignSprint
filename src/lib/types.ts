// Shared between the browser app and the API (server/ and api/).

export type Category = "recycling" | "compost" | "trash" | "special";

export type SpecialKind =
  | "hazardous"
  | "e-waste"
  | "drop-off"
  | "deposit-return"
  | "donate"
  | "bulky"
  | "medical";

export type Confidence = "high" | "medium" | "low";

export interface ItemPart {
  part: string;
  category: Category;
  note: string | null;
}

export interface SpecialInfo {
  kind: SpecialKind;
  headline: string; // e.g. "Hazardous drop-off"
  where: string;
  how: string;
  warning: string | null;
}

export interface Classification {
  unclear: boolean;
  retakeTip: string | null;
  item: string;
  material: string;
  category: Category;
  reason: string;
  confidence: Confidence;
  steps: string[];
  parts: ItemPart[];
  special: SpecialInfo | null;
  details: {
    localRule: string;
    whyItMatters: string;
    commonMistake: string;
    betterAlternative: string;
  };
}

export interface Source {
  title: string;
  url: string;
}

export type LocationSource = "ip" | "precise" | "manual";

export interface LocationInfo {
  source: LocationSource;
  /** Free text, used as-is when the user typed a place. */
  label: string;
  city?: string;
  region?: string;
  regionCode?: string;
  country?: string;
  countryCode?: string;
  postal?: string;
  lat?: number;
  lon?: number;
}

export interface ClassifyRequest {
  image: string; // data:image/jpeg;base64,...
  location: LocationInfo;
  advanced: boolean;
}

export interface ClassifyResponse {
  result: Classification;
  sources: Source[];
  advanced: boolean;
  ms: number;
}

export interface ApiError {
  error: string;
}
