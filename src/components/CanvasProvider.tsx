import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CANVAS_KEYS,
  SITE_CANVAS,
  clampPlacement,
  defaultPlacement,
  type BlockKind,
  type BlockStyle,
  type CanvasBlock,
  type CanvasDefaults,
  type Placement,
  type PlacementMap,
  type StyleMap,
} from "../config/canvas-defaults";
import { toast } from "sonner";
import { SITE_KEYS, refreshSiteContent, siteContent, writeSiteValue } from "../lib/site-content";
import { storeDataUrl } from "../lib/media-files";

/** A swap applied to a picture that already exists in the page design. */
export type MediaOverride = {
  kind: "image" | "video";
  src: string;
  crop?: { zoom: number; x: number; y: number };
};

const OVERRIDES_STORAGE_KEY = "media-overrides";
const TEXTS_STORAGE_KEY = "canvas-texts";

type CanvasContextValue = {
  editing: boolean;
  setEditing: (v: boolean) => void;
  /** Which block is open in the inspector. */
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;

  placements: PlacementMap;
  placementFor: (id: string) => Placement;
  setPlacement: (id: string, next: Placement) => void;

  blocks: CanvasBlock[];
  blocksFor: (page: string) => CanvasBlock[];
  blockById: (id: string) => CanvasBlock | undefined;
  addBlock: (page: string, kind: BlockKind, at?: Partial<Placement>) => CanvasBlock;
  duplicateBlock: (id: string, direction: "above" | "below") => CanvasBlock | undefined;
  updateBlock: (id: string, patch: Partial<CanvasBlock>) => void;
  removeBlock: (id: string) => void;

  styles: StyleMap;
  styleFor: (id: string) => BlockStyle | undefined;
  setStyle: (id: string, patch: BlockStyle) => void;
  clearStyle: (id: string) => void;

  hidden: string[];
  isHidden: (id: string) => boolean;
  hideBlock: (id: string) => void;
  showBlock: (id: string) => void;

  /** Words typed straight onto the page, keyed by `blockId#path`. */
  texts: Record<string, string>;
  textFor: (key: string) => string | undefined;
  setText: (key: string, value: string) => void;

  overrideFor: (id: string) => MediaOverride | undefined;
  setOverride: (id: string, value: MediaOverride) => void;
  clearOverride: (id: string) => void;

  /** Last measured bottom row of a page, used when dropping in new blocks. */
  bottomOf: (page: string) => number;
  setPageBottom: (page: string, rows: number) => void;

  snapshot: () => CanvasDefaults;
  reset: () => void;

  /** Step back through recent page changes. */
  canUndo: boolean;
  undo: () => void;
};

type HistoryEntry = {
  placements: PlacementMap;
  blocks: CanvasBlock[];
  styles: StyleMap;
  hidden: string[];
  texts: Record<string, string>;
};

const CanvasContext = createContext<CanvasContextValue | null>(null);

function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    toast.error(
      "This browser's storage is full — your latest change may not survive a reload.",
      { id: "canvas-store-failed" },
    );
  }
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * One-time content repair: saved canvas copies still hold the original
 * "Clyra" text for this block, and saved blocks win over the code defaults.
 * Rewrite only when the old text is still present so later edits are kept.
 */
function repairSavedBlocks(blocks: CanvasBlock[]): { blocks: CanvasBlock[]; changed: boolean } {
  let changed = false;
  const projectHeaderBackgroundIds = new Set([
    "project-lunethra-header-background",
    "project-clyra-header-background",
    "project-forgekind-header-background",
    "project-nestive-header-background",
    "project-pollenate-header-background",
    "grocery-header-background",
  ]);
  const next = blocks.flatMap((block) => {
    if (projectHeaderBackgroundIds.has(block.id)) {
      changed = true;
      return [];
    }
    if (
      block.id === "work-project-clyra-copy" &&
      block.title === "Clyra" &&
      block.description === "UI system and marketing site for a B2B SaaS product."
    ) {
      changed = true;
      return [{
        ...block,
        title: "Uber Color System",
        description: "A strategic consolidation of Uber's global color theory.",
      }];
    }
    return [block];
  });
  return { blocks: next, changed };
}

/** Saved blocks win over defaults by id, except defaults the user deleted. */
function mergeWithDefaults(saved: CanvasBlock[], removedIds: Set<string>): CanvasBlock[] {
  const savedIds = new Set(saved.map((block) => block.id));
  return [
    ...SITE_CANVAS.blocks.filter((block) => !savedIds.has(block.id) && !removedIds.has(block.id)),
    ...saved,
  ];
}

/**
 * One-time cleanup: older saves embedded whole images inside the page layout,
 * which overflowed browser storage and made later saves silently fail. Move
 * each embedded file into the shared media library and keep only its URL.
 */
async function extractEmbeddedMedia(
  blocks: CanvasBlock[],
  overrides: Record<string, MediaOverride>,
): Promise<{ blocks: CanvasBlock[] | null; overrides: Record<string, MediaOverride> | null }> {
  const urlCache = new Map<string, string>();
  const swap = async (src: string): Promise<string> => {
    if (!src.startsWith("data:")) return src;
    const cached = urlCache.get(src);
    if (cached) return cached;
    const url = await storeDataUrl(src);
    urlCache.set(src, url);
    return url;
  };

  let blocksChanged = false;
  const nextBlocks: CanvasBlock[] = [];
  for (const block of blocks) {
    if (block.src?.startsWith("data:")) {
      const url = await swap(block.src);
      if (url !== block.src) {
        blocksChanged = true;
        nextBlocks.push({ ...block, src: url });
        continue;
      }
    }
    nextBlocks.push(block);
  }

  let overridesChanged = false;
  const nextOverrides: Record<string, MediaOverride> = {};
  for (const [key, override] of Object.entries(overrides)) {
    if (override.src.startsWith("data:")) {
      const url = await swap(override.src);
      if (url !== override.src) {
        overridesChanged = true;
        nextOverrides[key] = { ...override, src: url };
        continue;
      }
    }
    nextOverrides[key] = override;
  }

  return {
    blocks: blocksChanged ? nextBlocks : null,
    overrides: overridesChanged ? nextOverrides : null,
  };
}

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placements, setPlacements] = useState<PlacementMap>(SITE_CANVAS.placements);
  const [blocks, setBlocks] = useState<CanvasBlock[]>(SITE_CANVAS.blocks);
  const [styles, setStyles] = useState<StyleMap>(SITE_CANVAS.styles);
  const [hidden, setHidden] = useState<string[]>(SITE_CANVAS.hidden);
  const [overrides, setOverrides] = useState<Record<string, MediaOverride>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});
  const bottoms = useRef<Record<string, number>>({});

  // Recent states, newest last, so a change can be stepped back.
  const past = useRef<HistoryEntry[]>([]);
  const lastPushAt = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  const live = useRef<HistoryEntry>({
    placements: SITE_CANVAS.placements,
    blocks: SITE_CANVAS.blocks,
    styles: SITE_CANVAS.styles,
    hidden: SITE_CANVAS.hidden,
    texts: {},
  });

  useEffect(() => {
    live.current = { placements, blocks, styles, hidden, texts };
  }, [placements, blocks, styles, hidden, texts]);

  /**
   * Remembers the current state before a change. Rapid changes of the same
   * sort (typing, dragging) collapse into one step.
   */
  const pushHistory = useCallback((coalesce = false) => {
    const now = Date.now();
    if (coalesce && now - lastPushAt.current < 700) {
      lastPushAt.current = now;
      return;
    }
    lastPushAt.current = now;
    past.current = [...past.current.slice(-49), live.current];
    setCanUndo(true);
  }, []);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    setCanUndo(past.current.length > 0);
    if (!prev) return;
    setPlacements(prev.placements);
    store(CANVAS_KEYS.placements, prev.placements);
    writeSiteValue(SITE_KEYS.canvasPlacements, prev.placements);
    setBlocks(prev.blocks);
    store(CANVAS_KEYS.blocks, prev.blocks);
    writeSiteValue(SITE_KEYS.canvasBlocks, prev.blocks);
    setStyles(prev.styles);
    store(CANVAS_KEYS.styles, prev.styles);
    writeSiteValue(SITE_KEYS.canvasStyles, prev.styles);
    setHidden(prev.hidden);
    store(CANVAS_KEYS.hidden, prev.hidden);
    writeSiteValue(SITE_KEYS.canvasHidden, prev.hidden);
    setTexts(prev.texts);
    store(TEXTS_STORAGE_KEY, prev.texts);
    writeSiteValue(SITE_KEYS.canvasTexts, prev.texts);
  }, []);


  // Pick up this browser's copy after hydration, then anything saved site-wide.
  useEffect(() => {
    const p = read<PlacementMap>(CANVAS_KEYS.placements);
    if (p) setPlacements({ ...SITE_CANVAS.placements, ...p });
    const b = read<CanvasBlock[]>(CANVAS_KEYS.blocks);
    if (Array.isArray(b)) {
      const savedIds = new Set(b.map((block) => block.id));
      const merged = [...SITE_CANVAS.blocks.filter((block) => !savedIds.has(block.id)), ...b];
      const repaired = repairSavedBlocks(merged);
      setBlocks(repaired.blocks);
      if (repaired.changed) {
        store(CANVAS_KEYS.blocks, repaired.blocks);
        writeSiteValue(SITE_KEYS.canvasBlocks, repaired.blocks);
      }
    }
    const s = read<StyleMap>(CANVAS_KEYS.styles);
    if (s) setStyles(s);
    const h = read<string[]>(CANVAS_KEYS.hidden);
    if (Array.isArray(h)) setHidden(h);
    const o = read<Record<string, MediaOverride>>(OVERRIDES_STORAGE_KEY);
    if (o) setOverrides(o);
    const t = read<Record<string, string>>(TEXTS_STORAGE_KEY);
    if (t) setTexts(t);

    void siteContent().then((values) => {
      const rp = values[SITE_KEYS.canvasPlacements];
      if (rp && typeof rp === "object") {
        setPlacements({ ...SITE_CANVAS.placements, ...(rp as PlacementMap) });
      }
      const rb = values[SITE_KEYS.canvasBlocks];
      if (Array.isArray(rb)) {
        const remote = rb as CanvasBlock[];
        const remoteIds = new Set(remote.map((block) => block.id));
        const merged = [...SITE_CANVAS.blocks.filter((block) => !remoteIds.has(block.id)), ...remote];
        const repaired = repairSavedBlocks(merged);
        setBlocks(repaired.blocks);
        if (repaired.changed) {
          store(CANVAS_KEYS.blocks, repaired.blocks);
          writeSiteValue(SITE_KEYS.canvasBlocks, repaired.blocks);
        }
      }
      const rs = values[SITE_KEYS.canvasStyles];
      if (rs && typeof rs === "object") setStyles(rs as StyleMap);
      const rh = values[SITE_KEYS.canvasHidden];
      if (Array.isArray(rh)) setHidden(rh as string[]);
      const ro = values[SITE_KEYS.mediaOverrides];
      if (ro && typeof ro === "object") {
        setOverrides(ro as Record<string, MediaOverride>);
      }
      const rt = values[SITE_KEYS.canvasTexts];
      if (rt && typeof rt === "object") setTexts(rt as Record<string, string>);
    });
  }, []);

  useEffect(() => {
    if (!editing) setSelectedId(null);
  }, [editing]);

  const placementFor = useCallback(
    (id: string) => placements[id] ?? defaultPlacement(id),
    [placements],
  );

  const setPlacement = useCallback((id: string, next: Placement) => {
    pushHistory(true);
    setPlacements((prev) => {
      const merged = { ...prev, [id]: clampPlacement(next) };
      store(CANVAS_KEYS.placements, merged);
      writeSiteValue(SITE_KEYS.canvasPlacements, merged);
      return merged;
    });
  }, [pushHistory]);


  const blocksFor = useCallback(
    (page: string) => blocks.filter((block) => block.page === page),
    [blocks],
  );

  const blockById = useCallback(
    (id: string) => blocks.find((b) => b.id === id),
    [blocks],
  );

  const persistBlocks = useCallback((next: CanvasBlock[]) => {
    store(CANVAS_KEYS.blocks, next);
    writeSiteValue(SITE_KEYS.canvasBlocks, next);
  }, []);

  const addBlock = useCallback(
    (page: string, kind: BlockKind, at?: Partial<Placement>) => {
      pushHistory();
      const block: CanvasBlock = {
        id: `block-${Math.random().toString(36).slice(2, 8)}`,
        page,
        kind,
        src: "",
        alt: "",
        caption: "",
        aspect: kind === "video" ? "16:9" : "3:2",
        ...(kind === "text" ? { text: "New text block", role: "body" } : {}),
        ...(kind === "shape"
          ? { fill: "var(--color-foreground)", opacity: 0.06, radius: 0 }
          : {}),
        ...(kind === "rule" ? { fill: "var(--color-border)", thickness: 1 } : {}),
      };
      setBlocks((prev) => {
        const next = [...prev, block];
        persistBlocks(next);
        return next;
      });
      const place: Placement = clampPlacement({
        x: at?.x ?? 0,
        y: at?.y ?? 0,
        w: at?.w ?? (kind === "text" ? 6 : 6),
        h: at?.h ?? (kind === "text" ? 6 : 12),
      });
      setPlacements((prev) => {
        const merged = { ...prev, [block.id]: place };
        store(CANVAS_KEYS.placements, merged);
        writeSiteValue(SITE_KEYS.canvasPlacements, merged);
        return merged;
      });
      setSelectedId(block.id);
      return block;
    },
    [persistBlocks, pushHistory],
  );

  const updateBlock = useCallback(
    (id: string, patch: Partial<CanvasBlock>) => {
      pushHistory(true);
      setBlocks((prev) => {
        const next = prev.map((b) => (b.id === id ? { ...b, ...patch } : b));
        persistBlocks(next);
        return next;
      });
    },
    [persistBlocks, pushHistory],
  );

  const duplicateBlock = useCallback(
    (id: string, direction: "above" | "below") => {
      const source = blocks.find((block) => block.id === id);
      if (!source) return undefined;
      pushHistory();
      const copy: CanvasBlock = {
        ...source,
        id: `block-${Math.random().toString(36).slice(2, 8)}`,
      };
      setBlocks((prev) => {
        const next = [...prev, copy];
        persistBlocks(next);
        return next;
      });
      const sourcePlacement = placementFor(id);
      const y = direction === "above"
        ? Math.max(0, sourcePlacement.y - sourcePlacement.h - 1)
        : sourcePlacement.y + sourcePlacement.h + 1;
      setPlacement(copy.id, { ...sourcePlacement, y });
      const sourceStyle = styles[id];
      if (sourceStyle) {
        setStyles((prev) => {
          const next = { ...prev, [copy.id]: { ...sourceStyle } };
          store(CANVAS_KEYS.styles, next);
          writeSiteValue(SITE_KEYS.canvasStyles, next);
          return next;
        });
      }
      setSelectedId(copy.id);
      return copy;
    },
    [blocks, persistBlocks, placementFor, pushHistory, setPlacement, styles],
  );

  const removeBlock = useCallback(
    (id: string) => {
      pushHistory();
      setBlocks((prev) => {
        const next = prev.filter((b) => b.id !== id);
        persistBlocks(next);
        return next;
      });
      setSelectedId((current) => (current === id ? null : current));
    },
    [persistBlocks, pushHistory],
  );

  const styleFor = useCallback((id: string) => styles[id], [styles]);

  const setStyle = useCallback((id: string, patch: BlockStyle) => {
    pushHistory(true);
    setStyles((prev) => {
      const merged = { ...prev, [id]: { ...prev[id], ...patch } };
      (Object.keys(merged[id]!) as (keyof BlockStyle)[]).forEach((k) => {
        if (merged[id]![k] === undefined) delete merged[id]![k];
      });
      store(CANVAS_KEYS.styles, merged);
      writeSiteValue(SITE_KEYS.canvasStyles, merged);
      return merged;
    });
  }, [pushHistory]);

  const clearStyle = useCallback((id: string) => {
    pushHistory();
    setStyles((prev) => {
      const merged = { ...prev };
      delete merged[id];
      store(CANVAS_KEYS.styles, merged);
      writeSiteValue(SITE_KEYS.canvasStyles, merged);
      return merged;
    });
  }, [pushHistory]);

  const isHidden = useCallback((id: string) => hidden.includes(id), [hidden]);

  const hideBlock = useCallback((id: string) => {
    pushHistory();
    setHidden((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      store(CANVAS_KEYS.hidden, next);
      writeSiteValue(SITE_KEYS.canvasHidden, next);
      return next;
    });
    setSelectedId((current) => (current === id ? null : current));
  }, [pushHistory]);

  const showBlock = useCallback((id: string) => {
    pushHistory();
    setHidden((prev) => {
      const next = prev.filter((h) => h !== id);
      store(CANVAS_KEYS.hidden, next);
      writeSiteValue(SITE_KEYS.canvasHidden, next);
      return next;
    });
  }, [pushHistory]);

  const overrideFor = useCallback((id: string) => overrides[id], [overrides]);

  const setOverride = useCallback((id: string, value: MediaOverride) => {
    setOverrides((prev) => {
      const next = { ...prev, [id]: value };
      store(OVERRIDES_STORAGE_KEY, next);
      writeSiteValue(SITE_KEYS.mediaOverrides, next);
      return next;
    });
  }, []);

  const clearOverride = useCallback((id: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      store(OVERRIDES_STORAGE_KEY, next);
      writeSiteValue(SITE_KEYS.mediaOverrides, next);
      return next;
    });
  }, []);

  const textFor = useCallback((key: string) => texts[key], [texts]);

  const setText = useCallback((key: string, value: string) => {
    pushHistory(true);
    setTexts((prev) => {
      if (prev[key] === value) return prev;
      const next = { ...prev, [key]: value };
      store(TEXTS_STORAGE_KEY, next);
      writeSiteValue(SITE_KEYS.canvasTexts, next);
      return next;
    });
  }, [pushHistory]);

  const bottomOf = useCallback((page: string) => bottoms.current[page] ?? 0, []);

  const setPageBottom = useCallback((page: string, rows: number) => {
    bottoms.current[page] = rows;
  }, []);

  const snapshot = useCallback(
    (): CanvasDefaults => ({ placements, blocks, styles, hidden }),
    [placements, blocks, styles, hidden],
  );

  const reset = useCallback(() => {
    pushHistory();
    setPlacements(SITE_CANVAS.placements);
    setBlocks(SITE_CANVAS.blocks);
    setStyles(SITE_CANVAS.styles);
    setHidden(SITE_CANVAS.hidden);
    setTexts({});
    setSelectedId(null);
    try {
      Object.values(CANVAS_KEYS).forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem(TEXTS_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    writeSiteValue(SITE_KEYS.canvasTexts, {});
    writeSiteValue(SITE_KEYS.canvasPlacements, SITE_CANVAS.placements);
    writeSiteValue(SITE_KEYS.canvasBlocks, SITE_CANVAS.blocks);
    writeSiteValue(SITE_KEYS.canvasStyles, SITE_CANVAS.styles);
    writeSiteValue(SITE_KEYS.canvasHidden, SITE_CANVAS.hidden);
  }, [pushHistory]);

  const value = useMemo(
    () => ({
      editing,
      setEditing,
      selectedId,
      setSelectedId,
      placements,
      placementFor,
      setPlacement,
      blocks,
      blocksFor,
      blockById,
      addBlock,
      duplicateBlock,
      updateBlock,
      removeBlock,
      styles,
      styleFor,
      setStyle,
      clearStyle,
      hidden,
      isHidden,
      hideBlock,
      showBlock,
      texts,
      textFor,
      setText,
      overrideFor,
      setOverride,
      clearOverride,
      bottomOf,
      setPageBottom,
      snapshot,
      reset,
      canUndo,
      undo,
    }),
    [
      editing,
      selectedId,
      placements,
      placementFor,
      setPlacement,
      blocks,
      blocksFor,
      blockById,
      addBlock,
      duplicateBlock,
      updateBlock,
      removeBlock,
      styles,
      styleFor,
      setStyle,
      clearStyle,
      hidden,
      isHidden,
      hideBlock,
      showBlock,
      texts,
      textFor,
      setText,
      overrideFor,
      setOverride,
      clearOverride,
      bottomOf,
      setPageBottom,
      snapshot,
      reset,
      canUndo,
      undo,
    ],
  );

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
}

export function useCanvas() {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error("useCanvas must be used inside CanvasProvider");
  return ctx;
}
