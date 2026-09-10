import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  MEDIA_STORAGE_KEY,
  SITE_MEDIA_BLOCKS,
  type MediaBlock,
  type MediaKind,
} from "../config/media-defaults";
import { SITE_KEYS, siteContent, writeSiteValue } from "../lib/site-content";

/** A swap applied to a picture that already exists in the page design. */
export type MediaOverride = {
  /** "image" covers stills and GIFs; "video" covers files and embed links. */
  kind: "image" | "video";
  src: string;
  /** How the picture is framed: zoom plus a nudge in each axis (percent). */
  crop?: { zoom: number; x: number; y: number };
};

const OVERRIDES_STORAGE_KEY = "media-overrides";

type MediaContextValue = {
  blocks: MediaBlock[];
  blocksFor: (page: string) => MediaBlock[];
  addBlock: (page: string, kind: MediaKind) => MediaBlock;
  updateBlock: (id: string, patch: Partial<MediaBlock>) => void;
  removeBlock: (id: string) => void;
  overrides: Record<string, MediaOverride>;
  overrideFor: (id: string) => MediaOverride | undefined;
  setOverride: (id: string, value: MediaOverride) => void;
  clearOverride: (id: string) => void;
  reset: () => void;
};

const MediaContext = createContext<MediaContextValue | null>(null);

function persist(blocks: MediaBlock[]) {
  try {
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(blocks));
  } catch {
    /* ignore */
  }
  writeSiteValue(SITE_KEYS.mediaBlocks, blocks);
}

function persistOverrides(overrides: Record<string, MediaOverride>) {
  try {
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    /* ignore */
  }
  writeSiteValue(SITE_KEYS.mediaOverrides, overrides);
}

export function MediaProvider({ children }: { children: ReactNode }) {
  const [blocks, setBlocks] = useState<MediaBlock[]>(SITE_MEDIA_BLOCKS);
  const [overrides, setOverrides] = useState<Record<string, MediaOverride>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MEDIA_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MediaBlock[];
        if (Array.isArray(parsed)) setBlocks(parsed);
      }
    } catch {
      /* ignore malformed storage */
    }
    try {
      const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, MediaOverride>;
        if (parsed && typeof parsed === "object") setOverrides(parsed);
      }
    } catch {
      /* ignore malformed storage */
    }
    // Anything saved for the whole site wins over this browser's copy.
    void siteContent().then((values) => {
      const remoteBlocks = values[SITE_KEYS.mediaBlocks];
      if (Array.isArray(remoteBlocks)) setBlocks(remoteBlocks as MediaBlock[]);
      const remoteOverrides = values[SITE_KEYS.mediaOverrides];
      if (remoteOverrides && typeof remoteOverrides === "object") {
        setOverrides(remoteOverrides as Record<string, MediaOverride>);
      }
    });
  }, []);

  const overrideFor = useCallback((id: string) => overrides[id], [overrides]);

  const setOverride = useCallback((id: string, value: MediaOverride) => {
    setOverrides((prev) => {
      const next = { ...prev, [id]: value };
      persistOverrides(next);
      return next;
    });
  }, []);

  const clearOverride = useCallback((id: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      persistOverrides(next);
      return next;
    });
  }, []);

  const blocksFor = useCallback(
    (page: string) => blocks.filter((b) => b.page === page),
    [blocks],
  );

  const addBlock = useCallback((page: string, kind: MediaKind) => {
    const block: MediaBlock = {
      id: `media-${Math.random().toString(36).slice(2, 8)}`,
      page,
      kind,
      src: "",
      alt: "",
      caption: "",
      aspect: kind === "video" ? "16:9" : "3:2",
      ...(kind === "text" ? { text: "New text block", role: "body" } : {}),
    };
    setBlocks((prev) => {
      const next = [...prev, block];
      persist(next);
      return next;
    });
    return block;
  }, []);

  const updateBlock = useCallback((id: string, patch: Partial<MediaBlock>) => {
    setBlocks((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, ...patch } : b));
      persist(next);
      return next;
    });
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setBlocks(SITE_MEDIA_BLOCKS);
    setOverrides({});
    try {
      localStorage.removeItem(MEDIA_STORAGE_KEY);
      localStorage.removeItem(OVERRIDES_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    writeSiteValue(SITE_KEYS.mediaBlocks, SITE_MEDIA_BLOCKS);
    writeSiteValue(SITE_KEYS.mediaOverrides, {});
  }, []);

  const value = useMemo(
    () => ({
      blocks,
      blocksFor,
      addBlock,
      updateBlock,
      removeBlock,
      overrides,
      overrideFor,
      setOverride,
      clearOverride,
      reset,
    }),
    [
      blocks,
      blocksFor,
      addBlock,
      updateBlock,
      removeBlock,
      overrides,
      overrideFor,
      setOverride,
      clearOverride,
      reset,
    ],
  );

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

export function useMedia() {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error("useMedia must be used inside MediaProvider");
  return ctx;
}
