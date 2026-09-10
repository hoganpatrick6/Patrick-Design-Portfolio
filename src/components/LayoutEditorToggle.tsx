import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { checkEditorAccess } from "../lib/type-settings.functions";
import { saveLayoutDefaults } from "../lib/layout-settings.functions";
import { useLayout } from "./LayoutProvider";

function GridIcon() {
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
      aria-hidden="true"
    >
      <path d="M4 4v16M10 4v16M14 4v16M20 4v16M4 4h16M4 20h16" />
    </svg>
  );
}

export function LayoutEditorToggle() {
  const { editing, setEditing, layout, reset } = useLayout();
  const [allowed, setAllowed] = useState(false);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const check = useServerFn(checkEditorAccess);
  const save = useServerFn(saveLayoutDefaults);

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
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!allowed) return null;

  async function onSave() {
    setStatus("Saving…");
    try {
      const res = await save({ data: { layout } });
      setStatus(res?.saved ? "Saved as site default" : "Save only works while editing");
    } catch {
      setStatus("Could not save");
    }
    setTimeout(() => setStatus(null), 2500);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) setEditing(true);
        }}
        aria-label="Layout grid"
        aria-expanded={open}
        className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
          editing || open
            ? "border-foreground/40 text-foreground"
            : "border-[var(--color-border)] text-[var(--color-foreground-muted)] hover:border-foreground/20 hover:text-foreground"
        }`}
      >
        <GridIcon />
        Layout
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-[60] w-72 rounded-md border border-[var(--color-border)] bg-background p-4 shadow-lg">
          <div className="mb-3 text-xs uppercase tracking-wide text-[var(--color-foreground-subtle)]">
            Layout grid (private)
          </div>
          <label className="flex items-center gap-2 text-xs text-[var(--color-foreground-muted)]">
            <input
              type="checkbox"
              checked={editing}
              onChange={(e) => setEditing(e.target.checked)}
              className="accent-foreground"
            />
            Show grid and move blocks
          </label>
          <p className="mt-3 text-xs leading-relaxed text-[var(--color-foreground-subtle)]">
            Drag a block by its label to move it across the 12 columns or
            between the horizontal content rows. Other blocks shuffle out of
            the way. Drag the bar on its right edge to resize it. Everything
            snaps to the grid.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-foreground transition-colors hover:border-foreground/30"
            >
              Save layout as site default
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-transparent px-2 py-1 text-xs text-[var(--color-foreground-muted)] transition-colors hover:text-foreground"
            >
              Reset
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
