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
  LAYOUT_STORAGE_KEY,
  SITE_LAYOUT_DEFAULTS,
  siteDefaultPlacement,
  clampPlacement,
  type LayoutMap,
  type Placement,
} from "../config/layout-defaults";
import type { RoleKey } from "../config/type-defaults";
import { SITE_KEYS, siteContent, writeSiteValue } from "../lib/site-content";

type LayoutContextValue = {
  layout: LayoutMap;
  editing: boolean;
  setEditing: (v: boolean) => void;
  placementFor: (id: string) => Placement;
  setPlacement: (id: string, next: Placement) => void;
  /** Sets the vertical order of a page's blocks, top to bottom. */
  setOrder: (ids: string[]) => void;
  /** Hides a text block from the page. */
  hideBlock: (id: string) => void;
  isHidden: (id: string) => boolean;
  /** Which block on the page is currently selected for styling. */
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  /** Type style override chosen for an existing block, if any. */
  roleFor: (id: string) => RoleKey | null;
  setBlockRole: (id: string, role: RoleKey | null) => void;
  reset: () => void;
};


const LayoutContext = createContext<LayoutContextValue | null>(null);

const FALLBACK: Placement = { colStart: 1, colSpan: 12 };
const HIDDEN_STORAGE_KEY = "layout-hidden-blocks";
const ROLES_STORAGE_KEY = "layout-block-roles";

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<LayoutMap>(SITE_LAYOUT_DEFAULTS);
  const [editing, setEditing] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const [roles, setRoles] = useState<Record<string, RoleKey>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Pick up locally saved positions after hydration.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LayoutMap;
        setLayout({ ...SITE_LAYOUT_DEFAULTS, ...parsed });
      }
      const rawHidden = localStorage.getItem(HIDDEN_STORAGE_KEY);
      if (rawHidden) setHidden(JSON.parse(rawHidden) as string[]);
      const rawRoles = localStorage.getItem(ROLES_STORAGE_KEY);
      if (rawRoles) setRoles(JSON.parse(rawRoles) as Record<string, RoleKey>);
    } catch {
      /* ignore malformed storage */
    }
    // Anything saved for the whole site wins over this browser's copy.
    void siteContent().then((values) => {
      const remote = values[SITE_KEYS.layout];
      if (remote && typeof remote === "object") {
        setLayout({ ...SITE_LAYOUT_DEFAULTS, ...(remote as LayoutMap) });
      }
      const remoteHidden = values[SITE_KEYS.layoutHidden];
      if (Array.isArray(remoteHidden)) setHidden(remoteHidden as string[]);
      const remoteRoles = values[SITE_KEYS.layoutRoles];
      if (remoteRoles && typeof remoteRoles === "object") {
        setRoles(remoteRoles as Record<string, RoleKey>);
      }
    });
  }, []);

  const hideBlock = useCallback((id: string) => {
    setHidden((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      writeSiteValue(SITE_KEYS.layoutHidden, next);
      return next;
    });
  }, []);

  const isHidden = useCallback((id: string) => hidden.includes(id), [hidden]);


  const placementFor = useCallback(
    (id: string) => layout[id] ?? siteDefaultPlacement(id) ?? FALLBACK,
    [layout],
  );

  const setPlacement = useCallback((id: string, next: Placement) => {
    setLayout((prev) => {
      const existing = prev[id] ?? siteDefaultPlacement(id);
      const order = next.order ?? existing?.order;
      const row = next.row ?? existing?.row;
      const placement = {
        ...next,
        ...(order === undefined ? {} : { order }),
        ...(row === undefined ? {} : { row }),
      };
      const merged = {
        ...prev,
        [id]: clampPlacement(placement),
      };
      try {
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(merged));
      } catch {
        /* ignore */
      }
      writeSiteValue(SITE_KEYS.layout, merged);
      return merged;
    });
  }, []);


  const setOrder = useCallback((ids: string[]) => {
    setLayout((prev) => {
      const merged = { ...prev };
      ids.forEach((id, index) => {
        const base = merged[id] ?? siteDefaultPlacement(id) ?? FALLBACK;
        merged[id] = clampPlacement({
          ...base,
          order: index + 1,
          row: index + 1,
        });
      });
      try {
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(merged));
      } catch {
        /* ignore */
      }
      writeSiteValue(SITE_KEYS.layout, merged);
      return merged;
    });
  }, []);

  const roleFor = useCallback((id: string) => roles[id] ?? null, [roles]);

  const setBlockRole = useCallback((id: string, role: RoleKey | null) => {
    setRoles((prev) => {
      const next = { ...prev };
      if (role) next[id] = role;
      else delete next[id];
      try {
        localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      writeSiteValue(SITE_KEYS.layoutRoles, next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setLayout(SITE_LAYOUT_DEFAULTS);
    setHidden([]);
    setRoles({});
    setSelectedId(null);
    try {
      localStorage.removeItem(LAYOUT_STORAGE_KEY);
      localStorage.removeItem(HIDDEN_STORAGE_KEY);
      localStorage.removeItem(ROLES_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    writeSiteValue(SITE_KEYS.layout, SITE_LAYOUT_DEFAULTS);
    writeSiteValue(SITE_KEYS.layoutHidden, []);
    writeSiteValue(SITE_KEYS.layoutRoles, {});
  }, []);

  const value = useMemo(
    () => ({
      layout,
      editing,
      setEditing,
      placementFor,
      setPlacement,
      setOrder,
      hideBlock,
      isHidden,
      selectedId,
      setSelectedId,
      roleFor,
      setBlockRole,
      reset,
    }),
    [
      layout,
      editing,
      placementFor,
      setPlacement,
      setOrder,
      hideBlock,
      isHidden,
      selectedId,
      roleFor,
      setBlockRole,
      reset,
    ],
  );


  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;

}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used inside LayoutProvider");
  return ctx;
}
