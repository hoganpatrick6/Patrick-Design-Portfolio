import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useTypeSettings } from "./TypeSettingsProvider";
import { checkEditorAccess, saveTypeDefaults } from "../lib/type-settings.functions";
import {
  FONT_STACKS,
  ROLE_LABELS,
  TYPE_ROLES,
  type AlignValue,
  type RoleKey,
  type TransformValue,
} from "../config/type-defaults";
import {
  CURATED_GOOGLE_FONTS,
  familyFromStack,
  fontStackFor,
  loadGoogleFont,
  readCustomFonts,
  writeCustomFonts,
} from "../lib/google-fonts";

function TypeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7V5h16v2M9 5v14M15 19H9" />
    </svg>
  );
}

const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const TRANSFORMS: TransformValue[] = ["none", "uppercase", "lowercase", "capitalize"];
const ALIGNS: AlignValue[] = ["left", "center", "right", "justify"];

const sliders = [
  { key: "scale", label: "Size", min: 0.5, max: 3, step: 0.01, suffix: "x", digits: 2 },
  { key: "leading", label: "Leading", min: 0.8, max: 2.4, step: 0.01, suffix: "", digits: 2 },
  { key: "tracking", label: "Tracking", min: -0.1, max: 0.4, step: 0.005, suffix: "em", digits: 3 },
  { key: "wordSpacing", label: "Word spacing", min: -0.1, max: 1, step: 0.01, suffix: "em", digits: 2 },
  { key: "measure", label: "Line length", min: 0, max: 120, step: 1, suffix: "ch", digits: 0 },
  { key: "paraSpacing", label: "Block spacing", min: 0, max: 4, step: 0.05, suffix: "em", digits: 2 },
] as const;

const fieldClass =
  "mt-1 w-full rounded border border-[var(--color-border)] bg-transparent px-2 py-1 text-xs text-foreground";

export function TypeSettingsPanel() {
  const { settings, setValue, copyRole, resetRole, reset } = useTypeSettings();
  const [allowed, setAllowed] = useState(false);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<RoleKey>("body");
  const [status, setStatus] = useState<string | null>(null);
  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const [fontQuery, setFontQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomFonts(readCustomFonts());
  }, []);

  const check = useServerFn(checkEditorAccess);
  const save = useServerFn(saveTypeDefaults);

  useEffect(() => {
    let cancelled = false;
    const key = new URLSearchParams(window.location.search).get("edit") ?? undefined;
    check({ data: { key } })
      .then((res) => {
        if (!cancelled) setAllowed(Boolean(res?.editor));
      })
      .catch(() => {
        /* stay hidden */
      });
    return () => {
      cancelled = true;
    };
  }, [check]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!allowed) return null;

  const current = settings[role];

  function addFont() {
    const name = fontQuery.trim().replace(/\s+/g, " ");
    if (!name) return;
    loadGoogleFont(name);
    setCustomFonts((prev) => {
      const next = prev.includes(name) ? prev : [...prev, name];
      writeCustomFonts(next);
      return next;
    });
    setValue(role, "family", fontStackFor(name));
    setFontQuery("");
  }

  function removeFont(name: string) {
    setCustomFonts((prev) => {
      const next = prev.filter((f) => f !== name);
      writeCustomFonts(next);
      return next;
    });
  }

  async function onSave() {
    setStatus("Saving…");
    try {
      const res = await save({ data: settings });
      setStatus(res?.saved ? "Saved as site default" : "Save only works while editing");
    } catch {
      setStatus("Could not save");
    }
    setTimeout(() => setStatus(null), 2500);
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Type settings"
        aria-expanded={open}
        className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
          open
            ? "border-foreground/40 text-foreground"
            : "border-[var(--color-border)] text-[var(--color-foreground-muted)] hover:border-foreground/20 hover:text-foreground"
        }`}
      >
        <TypeIcon />
        Type
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-[60] max-h-[70vh] w-80 overflow-y-auto rounded-md border border-[var(--color-border)] bg-background p-4 shadow-lg">
          <div className="mb-3 text-xs uppercase tracking-wide text-[var(--color-foreground-subtle)]">
            Type settings (private)
          </div>

          {/* Which text this affects */}
          <div className="mb-3 flex flex-wrap gap-1">
            {TYPE_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                  role === r
                    ? "border-foreground/40 text-foreground"
                    : "border-[var(--color-border)] text-[var(--color-foreground-muted)] hover:text-foreground"
                }`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-[var(--color-foreground-muted)]">Typeface</span>
              <select
                value={current.family}
                onChange={(e) => {
                  loadGoogleFont(familyFromStack(e.target.value));
                  setValue(role, "family", e.target.value);
                }}
                className={fieldClass}
              >
                <optgroup label="On this site">
                  {FONT_STACKS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </optgroup>
                {customFonts.length > 0 && (
                  <optgroup label="Added by you">
                    {customFonts.map((f) => (
                      <option key={f} value={fontStackFor(f)}>
                        {f}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="More typefaces">
                  {CURATED_GOOGLE_FONTS.filter((f) => !customFonts.includes(f)).map((f) => (
                    <option key={f} value={fontStackFor(f)}>
                      {f}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>

            {/* Add any Google Fonts typeface by name */}
            <div className="rounded border border-[var(--color-border)] p-2">
              <span className="text-xs text-[var(--color-foreground-muted)]">
                Add a typeface
              </span>
              <div className="mt-1 flex gap-1">
                <input
                  value={fontQuery}
                  onChange={(e) => setFontQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFont();
                    }
                  }}
                  placeholder="e.g. Fraunces"
                  className="min-w-0 flex-1 rounded border border-[var(--color-border)] bg-transparent px-2 py-1 text-xs text-foreground"
                />
                <button
                  type="button"
                  onClick={addFont}
                  className="rounded border border-[var(--color-border)] px-2 py-1 text-xs text-foreground transition-colors hover:border-foreground/30"
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-foreground-subtle)]">
                Type the exact name of any Google Fonts family. It's added to the list above
                and applied to the current text style right away.
              </p>
              {customFonts.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {customFonts.map((f) => (
                    <li
                      key={f}
                      className="flex items-center justify-between gap-2 text-xs text-foreground"
                    >
                      <span style={{ fontFamily: fontStackFor(f) }}>{f}</span>
                      <button
                        type="button"
                        onClick={() => removeFont(f)}
                        aria-label={`Remove ${f}`}
                        className="text-[var(--color-foreground-subtle)] transition-colors hover:text-foreground"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <label className="block">
              <span className="text-xs text-[var(--color-foreground-muted)]">Weight</span>
              <select
                value={current.weight}
                onChange={(e) => setValue(role, "weight", Number(e.target.value))}
                className={fieldClass}
              >
                {WEIGHTS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </label>

            {sliders.map((s) => (
              <label key={s.key} className="block">
                <span className="flex items-baseline justify-between text-xs text-[var(--color-foreground-muted)]">
                  <span>{s.label}</span>
                  <span className="tabular-nums">
                    {s.key === "measure" && current.measure === 0
                      ? "none"
                      : `${current[s.key].toFixed(s.digits)}${s.suffix}`}
                  </span>
                </span>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={current[s.key]}
                  onChange={(e) => setValue(role, s.key, Number(e.target.value))}
                  className="mt-1 w-full accent-foreground"
                />
              </label>
            ))}

            <label className="block">
              <span className="text-xs text-[var(--color-foreground-muted)]">Case</span>
              <select
                value={current.transform}
                onChange={(e) =>
                  setValue(role, "transform", e.target.value as TransformValue)
                }
                className={fieldClass}
              >
                {TRANSFORMS.map((t) => (
                  <option key={t} value={t}>
                    {t === "none" ? "As written" : t}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-[var(--color-foreground-muted)]">Alignment</span>
              <select
                value={current.align}
                onChange={(e) => setValue(role, "align", e.target.value as AlignValue)}
                className={fieldClass}
              >
                {ALIGNS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-xs text-[var(--color-foreground-muted)]">
              <input
                type="checkbox"
                checked={current.italic}
                onChange={(e) => setValue(role, "italic", e.target.checked)}
                className="accent-foreground"
              />
              Italic
            </label>

            <label className="block">
              <span className="text-xs text-[var(--color-foreground-muted)]">
                Copy these settings from
              </span>
              <select
                value=""
                onChange={(e) => {
                  const from = e.target.value as RoleKey;
                  if (from) copyRole(from, role);
                }}
                className={fieldClass}
              >
                <option value="">Choose…</option>
                {TYPE_ROLES.filter((r) => r !== role).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-foreground transition-colors hover:border-foreground/30"
            >
              Save as site default
            </button>
            <button
              type="button"
              onClick={() => resetRole(role)}
              className="rounded-full border border-transparent px-2 py-1 text-xs text-[var(--color-foreground-muted)] transition-colors hover:text-foreground"
            >
              Reset this
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-transparent px-2 py-1 text-xs text-[var(--color-foreground-muted)] transition-colors hover:text-foreground"
            >
              Reset all
            </button>
          </div>
          {status && (
            <div className="mt-2 text-xs text-[var(--color-foreground-subtle)]">{status}</div>
          )}
        </div>
      )}
    </div>
  );
}
