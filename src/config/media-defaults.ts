/**
 * Image and video blocks placed on the site's 12-column grid.
 *
 * Each block belongs to one page. Position (column start / span) is stored in
 * the layout grid under the same id, so media blocks drag and snap exactly
 * like text blocks. Written from the private media editor via
 * "Save media as site default".
 */

export type MediaKind = "image" | "video" | "text";

export type MediaBlock = {
  id: string;
  /** Page key: "about", "work", or "project" (all project pages). */
  page: string;
  kind: MediaKind;
  /** Image URL, video file URL, or a YouTube / Vimeo link. */
  src: string;
  alt: string;
  caption: string;
  /** Standard aspect ratio, e.g. "16:9". "auto" keeps the file's own shape. */
  aspect: string;
  /** Copy for text blocks. */
  text?: string;
  /** Which type role styles a text block: body, label, nav, heading, display. */
  role?: string;
  /** How the picture is framed inside the block: zoom and nudge in percent. */
  crop?: { zoom: number; x: number; y: number };
};

export const ASPECT_RATIOS = [
  "auto",
  "1:1",
  "4:5",
  "2:3",
  "9:16",
  "5:4",
  "4:3",
  "3:2",
  "16:9",
  "2:1",
  "21:9",
] as const;

export const SITE_MEDIA_BLOCKS: MediaBlock[] = [];

export const MEDIA_STORAGE_KEY = "media-blocks";

export function aspectToCss(aspect: string): string | undefined {
  if (!aspect || aspect === "auto") return undefined;
  const [w, h] = aspect.split(":").map(Number);
  if (!w || !h) return undefined;
  return `${w} / ${h}`;
}

/** Detects YouTube / Vimeo links, which need an iframe rather than <video>. */
export function embedUrl(src: string): string | null {
  try {
    const url = new URL(src);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return `https://www.youtube.com/embed${url.pathname}`;
    }
    if (host.endsWith("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (url.pathname.startsWith("/embed/")) return src;
    }
    if (host.endsWith("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    /* not a URL we recognise */
  }
  return null;
}
