import { loadSiteContent, saveSiteContentValue } from "./site-content.functions";

/**
 * Client-side access to the shared site content. Everything the on-page editor
 * changes is written here, so edits show up for every visitor rather than only
 * in the browser they were made in.
 */

export const SITE_KEYS = {
  mediaOverrides: "media.overrides",
  canvasPlacements: "canvas.placements",
  canvasBlocks: "canvas.blocks",
  canvasStyles: "canvas.styles",
  canvasTexts: "canvas.texts",
  canvasHidden: "canvas.hidden",
  canvasRemoved: "canvas.removed",
  canvasHeaderTemplate: "canvas.header-template",
  type: "type.settings",
  bullets: (id: string) => `bullets.${id}`,
} as const;

let cache: Promise<Record<string, unknown>> | null = null;

/** When this browser last saw each saved value, so it can detect being behind. */
const stamps = new Map<string, string>();

/** Loads (once per page) every value saved for the site. */
export function siteContent(): Promise<Record<string, unknown>> {
  if (typeof window === "undefined") return Promise.resolve({});
  if (!cache) {
    cache = loadSiteContent()
      .then((res) => {
        try {
          const seen = JSON.parse(res.stamps ?? "{}") as Record<string, string>;
          Object.entries(seen).forEach(([key, at]) => stamps.set(key, at));
        } catch {
          /* stamps are optional */
        }
        return JSON.parse(res.json ?? "{}") as Record<string, unknown>;
      })
      .catch(() => ({}));
  }
  return cache;
}

/** Drops the cached copy so the next read refetches the shared site content. */
export function refreshSiteContent(): Promise<Record<string, unknown>> {
  cache = null;
  return siteContent();
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();

let warnedStale = false;

function warnStale(): void {
  if (warnedStale) return;
  warnedStale = true;
  void import("sonner").then(({ toast }) => {
    toast.error("This tab is out of date", {
      id: "site-content-stale",
      description:
        "Newer changes were saved somewhere else, so this change was not saved. Reload the page to catch up.",
      duration: Infinity,
    });
  });
}

/** Saves a value for the whole site, batching rapid edits per key. */
export function writeSiteValue(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  void siteContent().then((values) => {
    values[key] = value;
  });
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      void saveSiteContentValue({
        data: { key, value, baseStamp: stamps.get(key) },
      })
        .then((res) => {
          // A stale tab must not overwrite newer content saved elsewhere.
          if ((res as { stale?: boolean })?.stale) {
            warnStale();
            return;
          }
          const stamp = (res as { stamp?: string })?.stamp;
          if (stamp) stamps.set(key, stamp);
        })
        .catch(() => {
          /* editing is not unlocked here; the local copy still applies */
        });
    }, 400),
  );
}
