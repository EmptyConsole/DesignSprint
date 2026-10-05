import type { LocationInfo } from "./types";

const TIMEOUT_MS = 6000;

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

const US_STATES: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO", Connecticut: "CT",
  Delaware: "DE", "District of Columbia": "DC", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID",
  Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME",
  Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO",
  Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM",
  "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR",
  Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN",
  Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY", "Puerto Rico": "PR",
};

/** Builds the short label shown in the chip, e.g. "Oakland, CA". */
export function shortLabel(
  loc: Pick<LocationInfo, "city" | "region" | "regionCode" | "country" | "countryCode" | "label">,
): string {
  if (!loc.city) return loc.label;
  const state = loc.region?.split(" · ")[0];
  const code =
    loc.regionCode && loc.regionCode.length <= 3
      ? loc.regionCode
      : loc.countryCode === "US" && state
        ? US_STATES[state]
        : undefined;
  const second = code || state || loc.country;
  return second ? `${loc.city}, ${second}` : loc.city;
}

/** Approximate location from the IP address. Tries two free, keyless services. */
export async function locateByIp(): Promise<LocationInfo> {
  try {
    const d = await getJson("https://ipapi.co/json/");
    if (d.error || !d.city) throw new Error(d.reason || "no city");
    const loc: LocationInfo = {
      source: "ip",
      label: "",
      city: d.city,
      region: d.region,
      regionCode: d.region_code,
      country: d.country_name,
      countryCode: d.country_code,
      postal: d.postal ?? undefined,
      lat: d.latitude,
      lon: d.longitude,
    };
    loc.label = shortLabel(loc);
    return loc;
  } catch {
    const d = await getJson("https://get.geojs.io/v1/ip/geo.json");
    const loc: LocationInfo = {
      source: "ip",
      label: "",
      city: d.city,
      region: d.region,
      country: d.country,
      countryCode: d.country_code,
      lat: d.latitude ? Number(d.latitude) : undefined,
      lon: d.longitude ? Number(d.longitude) : undefined,
    };
    loc.label = shortLabel(loc);
    return loc;
  }
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("This browser can't share location."));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 5 * 60 * 1000,
    });
  });
}

/** Precise location from device GPS, reverse-geocoded to a city. */
export async function locatePrecisely(): Promise<LocationInfo> {
  let pos: GeolocationPosition;
  try {
    pos = await getPosition();
  } catch (err) {
    const code = (err as GeolocationPositionError).code;
    throw new Error(
      code === 1
        ? "Location permission was denied. You can type your city instead."
        : "Couldn't get a GPS fix. Try again or type your city.",
    );
  }
  const { latitude: lat, longitude: lon } = pos.coords;
  const loc: LocationInfo = { source: "precise", label: "", lat, lon };
  try {
    const d = await getJson(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
    );
    const county = (d.localityInfo?.administrative as any[] | undefined)?.find((a) => /county/i.test(a.name))?.name;
    loc.city = d.city || d.locality || county;
    loc.region = [d.principalSubdivision, county && county !== loc.city ? county : null].filter(Boolean).join(" · ") || undefined;
    loc.regionCode = d.principalSubdivisionCode?.split("-")[1];
    loc.country = d.countryName;
    loc.countryCode = d.countryCode;
    loc.postal = d.postcode || undefined;
  } catch {
    // Coordinates alone are still useful to the model.
  }
  loc.label = loc.city ? shortLabel(loc) : `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
  return loc;
}

export function manualLocation(text: string): LocationInfo {
  return { source: "manual", label: text.trim() };
}
