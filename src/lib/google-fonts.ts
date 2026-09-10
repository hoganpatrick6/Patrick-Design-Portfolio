/**
 * On-demand Google Fonts loading for the private type panel.
 *
 * Built-in faces already ship in the page head. Anything else — curated extras
 * or a typeface you add by name — is loaded lazily the first time it's used and
 * remembered in local storage so it comes back on the next visit.
 */

export const CUSTOM_FONTS_KEY = "type-custom-fonts";

/** Families already loaded by the document head (or bundled locally). */
const PRELOADED = new Set([
  "Geist",
  "Instrument Serif",
  "Playfair Display",
  "Space Mono",
  "Bebas Neue",
  "Caveat",
  "PP Fragment Glare",
]);

/** Extra Google families offered in the picker out of the box. */
export const CURATED_GOOGLE_FONTS: string[] = [
  "Inter",
  "DM Sans",
  "Manrope",
  "Work Sans",
  "Figtree",
  "Outfit",
  "Sora",
  "Space Grotesk",
  "Syne",
  "Archivo",
  "Archivo Black",
  "Anton",
  "Oswald",
  "Libre Baskerville",
  "Lora",
  "Cormorant Garamond",
  "EB Garamond",
  "Fraunces",
  "DM Serif Display",
  "Newsreader",
  "Spectral",
  "Bodoni Moda",
  "Abril Fatface",
  "JetBrains Mono",
  "IBM Plex Mono",
  "IBM Plex Sans",
  "Roboto Mono",
  "Redaction",
];

/** Turns a family name into a CSS font stack. */
export function fontStackFor(family: string): string {
  return `'${family}', sans-serif`;
}

/** Reads the first quoted family name out of a CSS stack. */
export function familyFromStack(stack: string): string {
  const m = stack.match(/'([^']+)'|"([^"]+)"/);
  return (m?.[1] ?? m?.[2] ?? stack.split(",")[0] ?? "").trim();
}

const loaded = new Set<string>();

/** Injects a Google Fonts stylesheet for one family (idempotent, browser only). */
export function loadGoogleFont(family: string) {
  if (typeof document === "undefined") return;
  const name = family.trim();
  if (!name || PRELOADED.has(name) || loaded.has(name)) return;
  loaded.add(name);
  const id = `gf-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    name,
  ).replace(/%20/g, "+")}:ital,wght@0,100..900;1,100..900&display=swap`;
  document.head.appendChild(link);
}

export function readCustomFonts(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_FONTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((f) => typeof f === "string") : [];
  } catch {
    return [];
  }
}

export function writeCustomFonts(fonts: string[]) {
  try {
    localStorage.setItem(CUSTOM_FONTS_KEY, JSON.stringify(fonts));
  } catch {
    /* ignore */
  }
}
