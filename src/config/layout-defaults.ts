/**
 * Site-wide layout defaults.
 *
 * Every text block on the site sits on a 12-column design grid. These are the
 * positions visitors see. They can be edited by hand, or written from the
 * private layout editor via "Save layout as site default".
 */

export type Placement = {
  /** First column, 1–12. */
  colStart: number;
  /** How many columns wide, 1–12. */
  colSpan: number;
  /** Vertical order within the page. Lower numbers sit higher up. */
  order?: number;
  /** Snapped content row within the page. Lower numbers sit higher up. */
  row?: number;
};


export type LayoutMap = Record<string, Placement>;

export const GRID_COLUMNS = 12;
/** Distance between visible horizontal row lines while editing. */
export const GRID_ROW_HEIGHT = 64;

export const SITE_LAYOUT_DEFAULTS: LayoutMap = {
  "about-intro": { colStart: 1, colSpan: 3 },
  "about-contact": { colStart: 1, colSpan: 3 },
  "about-experience": { colStart: 4, colSpan: 9 },
  "about-skills": { colStart: 4, colSpan: 9 },
  "about-education": { colStart: 4, colSpan: 9 },
  "about-recommendations": { colStart: 4, colSpan: 9 },

  "work-intro": { colStart: 1, colSpan: 12 },
  "work-projects-label": { colStart: 1, colSpan: 12 },
  "work-projects": { colStart: 4, colSpan: 9 },

  "project-header": { colStart: 1, colSpan: 12 },
  "project-cover": { colStart: 1, colSpan: 12 },
  "project-details": { colStart: 1, colSpan: 3 },
  "project-overview": { colStart: 4, colSpan: 9 },
  "project-next": { colStart: 1, colSpan: 12 },
};

export const LAYOUT_STORAGE_KEY = "layout-placements";

export function clampPlacement(p: Placement): Placement {
  const colSpan = Math.min(Math.max(Math.round(p.colSpan), 1), GRID_COLUMNS);
  const colStart = Math.min(
    Math.max(Math.round(p.colStart), 1),
    GRID_COLUMNS - colSpan + 1,
  );
  const order = typeof p.order === "number" ? Math.max(1, Math.round(p.order)) : undefined;
  const row = typeof p.row === "number" ? Math.max(1, Math.round(p.row)) : undefined;
  return {
    colStart,
    colSpan,
    ...(order === undefined ? {} : { order }),
    ...(row === undefined ? {} : { row }),
  };
}


/**
 * Column defaults for repeated, per-project blocks on the Work page. These keep
 * the original design (image 1–5, title/description 6–9, meta 10–12) while
 * letting each piece be moved on its own.
 */
const PATTERN_DEFAULTS: Array<[string, Placement]> = [
  ["project-thumb-block:", { colStart: 1, colSpan: 5 }],
  ["project-title-block:", { colStart: 6, colSpan: 4 }],
  ["project-description-block:", { colStart: 6, colSpan: 4 }],
  ["project-category-block:", { colStart: 10, colSpan: 3 }],
  ["project-year-block:", { colStart: 10, colSpan: 3 }],
];

/** Site default placement for an id, including repeated per-project blocks. */
export function siteDefaultPlacement(id: string): Placement | undefined {
  const exact = SITE_LAYOUT_DEFAULTS[id];
  if (exact) return exact;
  const match = PATTERN_DEFAULTS.find(([prefix]) => id.startsWith(prefix));
  return match ? match[1] : undefined;
}
