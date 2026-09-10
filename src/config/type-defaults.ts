/**
 * Site-wide type defaults.
 *
 * Every text role on the site (body copy, small labels, nav, headings, and the
 * big intro/display lines) has a full set of typographic controls. These values
 * are what every visitor sees; they can be edited by hand, or written from the
 * private type panel via "Save as site default".
 */

export type TransformValue = "none" | "uppercase" | "lowercase" | "capitalize";
export type AlignValue = "left" | "center" | "right" | "justify";

export type RoleSettings = {
  /** CSS font-family stack. */
  family: string;
  /** Numeric font weight. */
  weight: number;
  /** Multiplier applied to the role's designed base size. */
  scale: number;
  /** Unitless line-height. */
  leading: number;
  /** Letter spacing, in em. */
  tracking: number;
  /** Word spacing, in em. */
  wordSpacing: number;
  /** Text casing. */
  transform: TransformValue;
  /** Italic on/off. */
  italic: boolean;
  /** Horizontal alignment (block-level text). */
  align: AlignValue;
  /** Measure / max line length in ch. 0 means no limit. */
  measure: number;
  /** Space between stacked blocks of this role, in em. */
  paraSpacing: number;
};

export const TYPE_ROLES = [
  "body",
  "label",
  "nav",
  "subhead",
  "heading",
  "display",
] as const;
export type RoleKey = (typeof TYPE_ROLES)[number];

export const ROLE_LABELS: Record<RoleKey, string> = {
  body: "Body copy",
  label: "Label",
  nav: "Navigation",
  subhead: "Subhead",
  heading: "Header",
  display: "Intro / display",
};

/** Styles offered when picking the look of a text block on the page. */
export const BLOCK_STYLE_ROLES = ["heading", "subhead", "body", "label"] as const;

export type TypeSettings = Record<RoleKey, RoleSettings>;

export const FONT_STACKS: { label: string; value: string }[] = [
  { label: "Geist (sans)", value: "'Geist', sans-serif" },
  { label: "Instrument Serif", value: "'Instrument Serif', serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Fragment Glare", value: "'PP Fragment Glare', serif" },
  { label: "Space Mono", value: "'Space Mono', monospace" },
  { label: "Bebas Neue", value: "'Bebas Neue', sans-serif" },
  { label: "Caveat", value: "'Caveat', cursive" },
];

const base: RoleSettings = {
  family: "'Geist', sans-serif",
  weight: 400,
  scale: 1,
  leading: 1.625,
  tracking: 0,
  wordSpacing: 0,
  transform: "none",
  italic: false,
  align: "left",
  measure: 0,
  paraSpacing: 0,
};

export const SITE_TYPE_DEFAULTS: TypeSettings = {
  body: { ...base },
  label: { ...base, scale: 1, leading: 1.5, tracking: 0.02 },
  nav: { ...base, leading: 1.25 },
  subhead: { ...base, weight: 500, leading: 1.35 },
  heading: { ...base, weight: 500, leading: 1.2 },
  display: {
    ...base,
    family: "'Instrument Serif', serif",
    leading: 1.3,
  },
};

export const TYPE_STORAGE_KEY = "type-settings";

/** CSS custom property name for a role/property pair. */
export function typeVar(role: RoleKey, prop: keyof RoleSettings): string {
  const kebab = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
  return `--type-${role}-${kebab}`;
}

/** Renders one setting as its CSS value. */
export function typeCssValue(prop: keyof RoleSettings, value: unknown): string {
  switch (prop) {
    case "family":
    case "transform":
    case "align":
      return String(value);
    case "italic":
      return value ? "italic" : "normal";
    case "tracking":
    case "wordSpacing":
    case "paraSpacing":
      return `${Number(value)}em`;
    case "measure":
      return Number(value) > 0 ? `${Number(value)}ch` : "none";
    default:
      return String(Number(value));
  }
}

const PROPS = Object.keys(base) as (keyof RoleSettings)[];

export function typeSettingsToCss(settings: TypeSettings): string {
  return TYPE_ROLES.flatMap((role) =>
    PROPS.map(
      (prop) =>
        `${typeVar(role, prop)}: ${typeCssValue(prop, settings[role]?.[prop] ?? base[prop])};`,
    ),
  ).join(" ");
}

/** Fills in any missing role/property from the defaults. */
export function mergeTypeSettings(
  partial: Partial<Record<RoleKey, Partial<RoleSettings>>> | null | undefined,
): TypeSettings {
  const out = {} as TypeSettings;
  TYPE_ROLES.forEach((role) => {
    out[role] = { ...SITE_TYPE_DEFAULTS[role], ...(partial?.[role] ?? {}) };
  });
  return out;
}
