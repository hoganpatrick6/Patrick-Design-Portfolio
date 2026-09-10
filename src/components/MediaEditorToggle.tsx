import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { checkEditorAccess } from "../lib/type-settings.functions";
import { saveMediaDefaults } from "../lib/media-settings.functions";
import { useLayout } from "./LayoutProvider";
import { useMedia } from "./MediaProvider";

function MediaIcon() {
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
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m3 16 5-5 4 4 3-3 6 5" />
      <circle cx="8.5" cy="8.5" r="1.2" />
    </svg>
  );
}

/**
 * Private control for adding image and video blocks to the current page.
 */
export function MediaEditorToggle({ page }: { page: string }) {
  const { editing, setEditing } = useLayout();
  const { blocks, blocksFor, addBlock, reset } = useMedia();
  const [allowed, setAllowed] = useState(false);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const check = useServerFn(checkEditorAccess);
  const save = useServerFn(saveMediaDefaults);

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

  const count = blocksFor(page).length;

  async function onSave() {
    setStatus("Saving…");
    try {
      const res = await save({ data: { blocks } });
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
        onClick={() => setOpen((v) => !v)}
        aria-label="Image and video blocks"
        aria-expanded={open}
        className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
          open
            ? "border-foreground/40 text-foreground"
            : "border-[var(--color-border)] text-[var(--color-foreground-muted)] hover:border-foreground/20 hover:text-foreground"
        }`}
      >
        <MediaIcon />
        Media
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-[60] w-72 rounded-md border border-[var(--color-border)] bg-background p-4 shadow-lg">
          <div className="mb-3 text-xs uppercase tracking-wide text-[var(--color-foreground-subtle)]">
            Images & video (private)
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                addBlock(page, "image");
                setEditing(true);
                setOpen(false);
              }}
              className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-foreground transition-colors hover:border-foreground/30"
            >
              + Image block
            </button>
            <button
              type="button"
              onClick={() => {
                addBlock(page, "video");
                setEditing(true);
                setOpen(false);
              }}
              className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-foreground transition-colors hover:border-foreground/30"
            >
              + Video block
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--color-foreground-subtle)]">
            {count} block{count === 1 ? "" : "s"} on this page. A new block drops
            straight onto the grid, with its own upload button and aspect-ratio
            row. Drag it by its label and pull its right edge to resize.
          </p>

          <label className="mt-3 flex items-center gap-2 text-xs text-[var(--color-foreground-muted)]">
            <input
              type="checkbox"
              checked={editing}
              onChange={(e) => setEditing(e.target.checked)}
              className="accent-foreground"
            />
            Show block controls
          </label>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-foreground transition-colors hover:border-foreground/30"
            >
              Save media as site default
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
