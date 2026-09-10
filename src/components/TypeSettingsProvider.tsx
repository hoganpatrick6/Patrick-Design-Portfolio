import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  SITE_TYPE_DEFAULTS,
  TYPE_ROLES,
  TYPE_STORAGE_KEY,
  mergeTypeSettings,
  typeCssValue,
  typeVar,
  type RoleKey,
  type RoleSettings,
  type TypeSettings,
} from "../config/type-defaults";
import {
  familyFromStack,
  loadGoogleFont,
  readCustomFonts,
} from "../lib/google-fonts";
import { SITE_KEYS, siteContent, writeSiteValue } from "../lib/site-content";

type TypeSettingsContextValue = {
  settings: TypeSettings;
  setValue: <K extends keyof RoleSettings>(
    role: RoleKey,
    key: K,
    value: RoleSettings[K],
  ) => void;
  /** Copies one role's settings onto another role. */
  copyRole: (from: RoleKey, to: RoleKey) => void;
  resetRole: (role: RoleKey) => void;
  reset: () => void;
};

const TypeSettingsContext = createContext<TypeSettingsContextValue | null>(null);

function applyToRoot(settings: TypeSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  TYPE_ROLES.forEach((role) => {
    (Object.keys(settings[role]) as (keyof RoleSettings)[]).forEach((prop) => {
      root.style.setProperty(
        typeVar(role, prop),
        typeCssValue(prop, settings[role][prop]),
      );
    });
  });
}

function persist(settings: TypeSettings) {
  try {
    localStorage.setItem(TYPE_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
  writeSiteValue(SITE_KEYS.type, settings);
}

export function TypeSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<TypeSettings>(SITE_TYPE_DEFAULTS);

  // Pick up any locally saved tweaks after hydration.
  useEffect(() => {
    // Re-load any typefaces added by hand so saved choices still render.
    readCustomFonts().forEach(loadGoogleFont);
    try {
      const raw = localStorage.getItem(TYPE_STORAGE_KEY);
      if (!raw) return;
      const merged = mergeTypeSettings(JSON.parse(raw));
      Object.values(merged).forEach((r) => loadGoogleFont(familyFromStack(r.family)));
      setSettings(merged);
      applyToRoot(merged);
    } catch {
      /* ignore malformed storage */
    }
    // Anything saved for the whole site wins over this browser's copy.
    void siteContent().then((values) => {
      const remote = values[SITE_KEYS.type];
      if (!remote || typeof remote !== "object") return;
      const merged = mergeTypeSettings(remote);
      Object.values(merged).forEach((r) => loadGoogleFont(familyFromStack(r.family)));
      setSettings(merged);
      applyToRoot(merged);
    });
  }, []);

  const setValue = useCallback(
    <K extends keyof RoleSettings>(role: RoleKey, key: K, value: RoleSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [role]: { ...prev[role], [key]: value } };
        applyToRoot(next);
        persist(next);
        return next;
      });
    },
    [],
  );

  const copyRole = useCallback((from: RoleKey, to: RoleKey) => {
    setSettings((prev) => {
      const next = { ...prev, [to]: { ...prev[from] } };
      applyToRoot(next);
      persist(next);
      return next;
    });
  }, []);

  const resetRole = useCallback((role: RoleKey) => {
    setSettings((prev) => {
      const next = { ...prev, [role]: { ...SITE_TYPE_DEFAULTS[role] } };
      applyToRoot(next);
      persist(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(SITE_TYPE_DEFAULTS);
    applyToRoot(SITE_TYPE_DEFAULTS);
    try {
      localStorage.removeItem(TYPE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    writeSiteValue(SITE_KEYS.type, SITE_TYPE_DEFAULTS);
  }, []);

  return (
    <TypeSettingsContext.Provider
      value={{ settings, setValue, copyRole, resetRole, reset }}
    >
      {children}
    </TypeSettingsContext.Provider>
  );
}

export function useTypeSettings() {
  const ctx = useContext(TypeSettingsContext);
  if (!ctx) {
    throw new Error("useTypeSettings must be used inside TypeSettingsProvider");
  }
  return ctx;
}
