import lunethraThumb from "../assets/projects/lunethra.jpg";
import driftwellThumb from "../assets/projects/driftwell.jpg";
import clyraThumb from "../assets/projects/clyra.jpg";
import forgekindThumb from "../assets/projects/forgekind.jpg";
import nestiveThumb from "../assets/projects/nestive.jpg";
import pollenateThumb from "../assets/projects/pollenate.jpg";

/**
 * The page canvas.
 *
 * Every piece of content on a page — the copy that ships with the design as
 * well as anything dropped in later — is a block with a free position on a
 * shared grid: 12 columns across, and a fine vertical baseline row unit down.
 *
 * Placements are what visitors see. They can be edited by hand here, or
 * written from the on-page editor via "Save as site default".
 */

export type AlignValue = "left" | "center" | "right" | "justify";
export type TransformValue = "none" | "uppercase" | "lowercase" | "capitalize";

/** Free position on the canvas, in grid units. */
export type Placement = {
  /** First column, 0–11. */
  x: number;
  /** Row from the top of the page, in baseline units. */
  y: number;
  /** Width in columns, 1–12. */
  w: number;
  /** Minimum height in baseline rows; taller content grows past it. */
  h: number;
};

/** Per-block typographic overrides. Anything left out follows the shared style. */
export type BlockStyle = Partial<{
  family: string;
  weight: number;
  /** Font size in px. */
  size: number;
  /** Unitless line height. */
  leading: number;
  /** Letter spacing in em. */
  tracking: number;
  /** Word spacing in em. */
  wordSpacing: number;
  align: AlignValue;
  transform: TransformValue;
  italic: boolean;
  /** Any CSS colour, usually a theme token such as var(--color-foreground). */
  color: string;
}>;

export type BlockKind = "text" | "image" | "video" | "shape" | "rule" | "project-description";

/** A block added through the editor (text, picture or video). */
export type CanvasBlock = {
  id: string;
  /** Page key: "about", "work" or "project:<slug>". */
  page: string;
  kind: BlockKind;
  /** Image URL, video file URL, or a YouTube / Vimeo link. */
  src: string;
  alt: string;
  caption: string;
  /** Frame shape, e.g. "16:9". "auto" keeps the file's own shape. */
  aspect: string;
  /** Copy for text blocks. */
  text?: string;
  /** Shared style this block follows: body, label, heading… */
  role?: string;
  /** How a picture sits inside its frame. */
  crop?: { zoom: number; x: number; y: number };
  /** Colour of a background shape. */
  fill?: string;
  /** Corner rounding of a background shape, in px. */
  radius?: number;
  /** Opacity of a background shape, 0–1. */
  opacity?: number;
  /** Thickness of a rule line, in px. */
  thickness?: number;
  /** Optional destination for linked media or project copy. */
  href?: string;
  /** Structured copy used by independently editable project-list entries. */
  title?: string;
  description?: string;
  category?: string;
  year?: string;
};

export type PlacementMap = Record<string, Placement>;
export type StyleMap = Record<string, BlockStyle>;

export type CanvasDefaults = {
  placements: PlacementMap;
  blocks: CanvasBlock[];
  styles: StyleMap;
  hidden: string[];
};

export const GRID_COLUMNS = 12;
/** Height of one baseline row, in px. */
export const ROW_UNIT = 24;
/** Space between columns, in px. */
export const GUTTER = 24;
/** Below this width the canvas stacks into a single readable column. */
export const STACK_BREAKPOINT = 768;

/** The four editable fields that make up every project-page header. */
export const PROJECT_HEADER_SLOTS = ["title", "client", "role", "summary"] as const;
export type ProjectHeaderSlot = (typeof PROJECT_HEADER_SLOTS)[number];

const PROJECT_SLUGS = [
  "uber-credit-card",
  "grocery-fresh",
  "uber-color-system",
  "carbon-health-rebrand",
  "uber-photography-guidelines",
  "pollenate",
] as const;

export function projectHeaderIds(slot: ProjectHeaderSlot): string[] {
  return PROJECT_SLUGS.map((slug) => `project-${slug}-${slot}`);
}

/** The per-project overview block ids (the overview used to be shared by id). */
export function projectOverviewIds(): string[] {
  return PROJECT_SLUGS.map((slug) => `project-${slug}-overview`);
}

/** Finds the shared header field represented by a block or nested type target. */
export function projectHeaderSlotFor(id: string): ProjectHeaderSlot | null {
  const blockId = id.split("#")[0] ?? id;
  for (const slot of PROJECT_HEADER_SLOTS) {
    if (projectHeaderIds(slot).includes(blockId)) return slot;
  }
  return null;
}

/** Every matching field, retaining a nested type path when one is selected. */
export function projectHeaderPeerIds(id: string): string[] {
  const slot = projectHeaderSlotFor(id);
  if (!slot) return [id];
  const suffix = id.includes("#") ? `#${id.split("#").slice(1).join("#")}` : "";
  return projectHeaderIds(slot).map((blockId) => `${blockId}${suffix}`);
}

export const SITE_CANVAS: CanvasDefaults = {
  "placements": {
    "about-intro": {
      "x": 0,
      "y": 0,
      "w": 4,
      "h": 6
    },
    "about-contact": {
      "x": 0,
      "y": 8,
      "w": 4,
      "h": 6
    },
    "about-experience": {
      "x": 4,
      "y": 0,
      "w": 8,
      "h": 40
    },
    "about-skills": {
      "x": 4,
      "y": 44,
      "w": 8,
      "h": 16
    },
    "about-education": {
      "x": 4,
      "y": 62,
      "w": 8,
      "h": 10
    },
    "about-recommendations": {
      "x": 4,
      "y": 74,
      "w": 8,
      "h": 14
    },
    "resume-intro": {
      "x": 0,
      "y": 0,
      "w": 4,
      "h": 6
    },
    "resume-contact": {
      "x": 0,
      "y": 8,
      "w": 4,
      "h": 6
    },
    "resume-experience": {
      "x": 4,
      "y": 8,
      "w": 8,
      "h": 40
    },
    "resume-skills": {
      "x": 4,
      "y": 44,
      "w": 8,
      "h": 16
    },
    "resume-education": {
      "x": 4,
      "y": 62,
      "w": 8,
      "h": 10
    },
    "resume-recommendations": {
      "x": 4,
      "y": 74,
      "w": 8,
      "h": 14
    },
    "work-intro": {
      "x": 0,
      "y": 0,
      "w": 12,
      "h": 8
    },
    "work-projects-label": {
      "x": 0,
      "y": 12,
      "w": 2,
      "h": 2
    },
    "work-project-uber-credit-card-image": { "x": 2, "y": 12, "w": 5, "h": 14 },
    "work-project-uber-credit-card-copy": { "x": 7, "y": 12, "w": 5, "h": 14 },
    "work-project-grocery-fresh-image": { "x": 2, "y": 28, "w": 5, "h": 14 },
    "work-project-grocery-fresh-copy": { "x": 7, "y": 28, "w": 5, "h": 14 },
    "work-project-uber-color-system-image": { "x": 2, "y": 44, "w": 5, "h": 14 },
    "work-project-uber-color-system-copy": { "x": 7, "y": 44, "w": 5, "h": 14 },
    "work-project-carbon-health-rebrand-image": { "x": 2, "y": 60, "w": 5, "h": 14 },
    "work-project-carbon-health-rebrand-copy": { "x": 7, "y": 60, "w": 5, "h": 14 },
    "work-project-nestive-image": { "x": 2, "y": 76, "w": 5, "h": 14 },
    "work-project-nestive-copy": { "x": 7, "y": 76, "w": 5, "h": 14 },
    "work-project-pollenate-image": { "x": 2, "y": 92, "w": 5, "h": 14 },
    "work-project-pollenate-copy": { "x": 7, "y": 92, "w": 5, "h": 14 },
    "work-rule-intro": { "x": 0, "y": 0, "w": 12, "h": 1 },
    "work-rule-uber-credit-card": { "x": 7, "y": 26, "w": 5, "h": 1 },
    "work-rule-grocery-fresh": { "x": 7, "y": 42, "w": 5, "h": 1 },
    "work-rule-uber-color-system": { "x": 7, "y": 58, "w": 5, "h": 1 },
    "work-rule-carbon-health-rebrand": { "x": 7, "y": 74, "w": 5, "h": 1 },
    "work-rule-nestive": { "x": 7, "y": 90, "w": 5, "h": 1 },
    "work-rule-pollenate": { "x": 7, "y": 106, "w": 5, "h": 1 },
    "project-uber-credit-card-title": {
      "x": 0,
      "y": 1,
      "w": 12,
      "h": 6
    },
    "project-uber-credit-card-client": {
      "x": 0,
      "y": 11,
      "w": 2,
      "h": 4
    },
    "project-uber-credit-card-role": {
      "x": 0,
      "y": 11,
      "w": 2,
      "h": 4
    },
    "project-uber-credit-card-summary": {
      "x": 6,
      "y": 11,
      "w": 6,
      "h": 6
    },
    "project-uber-color-system-title": { "x": 0, "y": 1, "w": 12, "h": 6 },
    "project-uber-color-system-client": { "x": 0, "y": 11, "w": 2, "h": 4 },
    "project-uber-color-system-role": { "x": 0, "y": 11, "w": 2, "h": 4 },
    "project-uber-color-system-summary": { "x": 6, "y": 11, "w": 6, "h": 6 },
    "project-carbon-health-rebrand-title": { "x": 0, "y": 1, "w": 12, "h": 6 },
    "project-carbon-health-rebrand-client": { "x": 0, "y": 11, "w": 2, "h": 4 },
    "project-carbon-health-rebrand-role": { "x": 0, "y": 11, "w": 2, "h": 4 },
    "project-carbon-health-rebrand-summary": { "x": 6, "y": 11, "w": 6, "h": 6 },
    "project-nestive-title": { "x": 0, "y": 1, "w": 12, "h": 6 },
    "project-nestive-client": { "x": 0, "y": 11, "w": 2, "h": 4 },
    "project-nestive-role": { "x": 0, "y": 11, "w": 2, "h": 4 },
    "project-nestive-summary": { "x": 6, "y": 11, "w": 6, "h": 6 },
    "project-pollenate-title": { "x": 0, "y": 1, "w": 12, "h": 6 },
    "project-pollenate-client": { "x": 0, "y": 11, "w": 2, "h": 4 },
    "project-pollenate-role": { "x": 0, "y": 11, "w": 2, "h": 4 },
    "project-pollenate-summary": { "x": 6, "y": 11, "w": 6, "h": 6 },
    "project-uber-credit-card-overview": { "x": 4, "y": 22, "w": 8, "h": 16 },
    "project-grocery-fresh-overview": { "x": 4, "y": 22, "w": 8, "h": 16 },
    "project-uber-color-system-overview": { "x": 4, "y": 22, "w": 8, "h": 16 },
    "project-carbon-health-rebrand-overview": { "x": 4, "y": 22, "w": 8, "h": 16 },
    "project-nestive-overview": { "x": 4, "y": 22, "w": 8, "h": 16 },
    "project-pollenate-overview": { "x": 4, "y": 22, "w": 8, "h": 16 },
    "project-next": {
      "x": 0,
      "y": 42,
      "w": 12,
      "h": 20
    },
    "project-grocery-fresh-title": {
      "x": 0,
      "y": 1,
      "w": 12,
      "h": 6
    },
    "project-grocery-fresh-client": {
      "x": 0,
      "y": 11,
      "w": 2,
      "h": 3
    },
    "project-grocery-fresh-role": {
      "x": 0,
      "y": 11,
      "w": 2,
      "h": 3
    },
    "project-grocery-fresh-summary": {
      "x": 6,
      "y": 11,
      "w": 6,
      "h": 6
    },
    "grocery-fresh-hero": {
      "x": 0,
      "y": 18,
      "w": 12,
      "h": 36
    },
    "grocery-fresh-story-title": {
      "x": 3,
      "y": 59,
      "w": 6,
      "h": 3
    },
    "grocery-fresh-story-intro": {
      "x": 4,
      "y": 63,
      "w": 4,
      "h": 4
    },
    "grocery-fresh-story-detail": {
      "x": 4,
      "y": 68,
      "w": 4,
      "h": 6
    },
    "grocery-fresh-oranges": {
      "x": 0,
      "y": 75,
      "w": 6,
      "h": 32
    },
    "grocery-fresh-blueberries": {
      "x": 6,
      "y": 75,
      "w": 6,
      "h": 32
    },
    "grocery-fresh-tomatoes": {
      "x": 0,
      "y": 108,
      "w": 6,
      "h": 32
    },
    "grocery-fresh-eggs": {
      "x": 6,
      "y": 108,
      "w": 6,
      "h": 32
    },
    "grocery-fresh-campaign": {
      "x": 0,
      "y": 149,
      "w": 12,
      "h": 24
    }
  },
  "blocks": [
    { "id": "work-project-uber-credit-card-image", "page": "work", "kind": "image", "src": lunethraThumb, "alt": "Uber Credit Card", "caption": "", "aspect": "3:2" },
    { "id": "work-project-uber-credit-card-copy", "page": "work", "kind": "project-description", "src": "", "alt": "", "caption": "", "aspect": "auto", "href": "/work/uber-credit-card", "title": "Uber Credit Card", "description": "Design and art direction for Uber’s first multi-market co-brand credit card", "category": "Brand Design,\nArt Direction", "year": "2025" },
    { "id": "work-project-grocery-fresh-image", "page": "work", "kind": "image", "src": driftwellThumb, "alt": "Grocery Fresh", "caption": "", "aspect": "3:2" },
    { "id": "work-project-grocery-fresh-copy", "page": "work", "kind": "project-description", "src": "", "alt": "", "caption": "", "aspect": "auto", "href": "/work/grocery-fresh", "title": "Grocery Fresh", "description": "Why would anyone want a stranger to do their shopping for them?", "category": "Art Direction", "year": "2023" },
    { "id": "work-project-uber-color-system-image", "page": "work", "kind": "image", "src": clyraThumb, "alt": "Clyra", "caption": "", "aspect": "3:2" },
    { "id": "work-project-uber-color-system-copy", "page": "work", "kind": "project-description", "src": "", "alt": "", "caption": "", "aspect": "auto", "href": "/work/uber-color-system", "title": "Uber Color System", "description": "A strategic consolidation of Uber's global color theory.", "category": "Product Design", "year": "2023" },
    { "id": "work-project-carbon-health-rebrand-image", "page": "work", "kind": "image", "src": forgekindThumb, "alt": "Forgekind", "caption": "", "aspect": "3:2" },
    { "id": "work-project-carbon-health-rebrand-copy", "page": "work", "kind": "project-description", "src": "", "alt": "", "caption": "", "aspect": "auto", "href": "/work/carbon-health-rebrand", "title": "Forgekind", "description": "Identity, typography, and web experience for a creative studio.", "category": "Brand & Web", "year": "2022" },
    { "id": "work-project-nestive-image", "page": "work", "kind": "image", "src": nestiveThumb, "alt": "Nestive", "caption": "", "aspect": "3:2" },
    { "id": "work-project-nestive-copy", "page": "work", "kind": "project-description", "src": "", "alt": "", "caption": "", "aspect": "auto", "href": "/work/nestive", "title": "Nestive", "description": "Magazine design and digital editorial direction.", "category": "Editorial", "year": "2022" },
    { "id": "work-project-pollenate-image", "page": "work", "kind": "image", "src": pollenateThumb, "alt": "Pollenate", "caption": "", "aspect": "3:2" },
    { "id": "work-project-pollenate-copy", "page": "work", "kind": "project-description", "src": "", "alt": "", "caption": "", "aspect": "auto", "href": "/work/pollenate", "title": "Pollenate", "description": "Visual direction and packaging for a consumer goods launch.", "category": "Art Direction", "year": "2021" }
    ,
    { "id": "work-rule-intro", "page": "work", "kind": "rule", "src": "", "alt": "", "caption": "", "aspect": "auto", "fill": "var(--color-border)", "thickness": 1 },
    { "id": "work-rule-uber-credit-card", "page": "work", "kind": "rule", "src": "", "alt": "", "caption": "", "aspect": "auto", "fill": "var(--color-border)", "thickness": 1 },
    { "id": "work-rule-grocery-fresh", "page": "work", "kind": "rule", "src": "", "alt": "", "caption": "", "aspect": "auto", "fill": "var(--color-border)", "thickness": 1 },
    { "id": "work-rule-uber-color-system", "page": "work", "kind": "rule", "src": "", "alt": "", "caption": "", "aspect": "auto", "fill": "var(--color-border)", "thickness": 1 },
    { "id": "work-rule-carbon-health-rebrand", "page": "work", "kind": "rule", "src": "", "alt": "", "caption": "", "aspect": "auto", "fill": "var(--color-border)", "thickness": 1 },
    { "id": "work-rule-nestive", "page": "work", "kind": "rule", "src": "", "alt": "", "caption": "", "aspect": "auto", "fill": "var(--color-border)", "thickness": 1 },
    { "id": "work-rule-pollenate", "page": "work", "kind": "rule", "src": "", "alt": "", "caption": "", "aspect": "auto", "fill": "var(--color-border)", "thickness": 1 }
  ],
  "styles": {},
  "hidden": []
};

export const CANVAS_KEYS = {
  placements: "canvas-placements",
  blocks: "canvas-blocks",
  styles: "canvas-styles",
  hidden: "canvas-hidden",
  removed: "canvas-removed",
} as const;

const FALLBACK: Placement = { x: 0, y: 0, w: 12, h: 6 };

export function clampPlacement(p: Placement): Placement {
  const w = Math.min(Math.max(Math.round(p.w), 1), GRID_COLUMNS);
  const x = Math.min(Math.max(Math.round(p.x), 0), GRID_COLUMNS - w);
  const y = Math.max(0, Math.round(p.y));
  const h = Math.max(1, Math.round(p.h));
  return { x, y, w, h };
}

export function defaultPlacement(id: string): Placement {
  return SITE_CANVAS.placements[id] ?? FALLBACK;
}

/** Turns per-block overrides into inline CSS. */
export function blockStyleToCss(style: BlockStyle | undefined): React.CSSProperties {
  if (!style) return {};
  const css: React.CSSProperties = {};
  if (style.family) css.fontFamily = style.family;
  if (style.weight) css.fontWeight = style.weight;
  if (style.size) css.fontSize = `${style.size}px`;
  if (style.leading) css.lineHeight = style.leading;
  if (style.tracking !== undefined) css.letterSpacing = `${style.tracking}em`;
  if (style.wordSpacing !== undefined) css.wordSpacing = `${style.wordSpacing}em`;
  if (style.align) css.textAlign = style.align;
  if (style.transform) css.textTransform = style.transform;
  if (style.italic !== undefined) css.fontStyle = style.italic ? "italic" : "normal";
  if (style.color) css.color = style.color;
  return css;
}

/** True when the override touches anything other than colour. */
export function styleTouchesType(style: BlockStyle | undefined): boolean {
  if (!style) return false;
  return [
    "family",
    "weight",
    "size",
    "leading",
    "tracking",
    "wordSpacing",
    "transform",
    "italic",
  ].some((k) => style[k as keyof BlockStyle] !== undefined);
}

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
    if (host === "youtu.be") return `https://www.youtube.com/embed${url.pathname}`;
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

/** Colour choices offered in the block inspector. */
export const BLOCK_COLORS: { label: string; value: string }[] = [
  { label: "Default", value: "" },
  { label: "Text", value: "var(--color-foreground)" },
  { label: "Muted", value: "var(--color-foreground-muted)" },
  { label: "Subtle", value: "var(--color-foreground-subtle)" },
  { label: "Background", value: "var(--color-background)" },
  { label: "Accent", value: "var(--color-chart-1)" },
];

/** Fill choices offered for background shapes. */
export const SHAPE_FILLS: { label: string; value: string }[] = [
  { label: "Paper", value: "var(--color-foreground)" },
  { label: "Page", value: "var(--color-background)" },
  { label: "Accent", value: "var(--color-chart-1)" },
  { label: "Warm", value: "#e8dfd2" },
  { label: "Cool", value: "#d7e0e6" },
  { label: "Ink", value: "#1b1b1b" },
];
