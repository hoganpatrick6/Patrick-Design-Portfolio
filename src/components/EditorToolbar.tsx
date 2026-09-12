import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { checkEditorAccess } from "../lib/type-settings.functions";
import { saveCanvasDefaults } from "../lib/canvas-settings.functions";
import { useCanvas } from "./CanvasProvider";

/**
 * The private on-page editor bar: switch editing on, drop new blocks onto the
 * page, and publish the current arrangement to everyone.
 */
export function EditorToolbar({ page }: { page: string }) {
  const { editing, setEditing, addBlock, bottomOf, snapshot, reset } = useCanvas();
  const [allowed, setAllowed] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const check = useServerFn(checkEditorAccess);
  const save = useServerFn(saveCanvasDefaults);

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

  if (!allowed) return null;

  /** New blocks land just under whatever is already on the page. */
  const bottomRow = () => bottomOf(page);

  async function onSave() {
    setStatus("Saving…");
    try {
      const res = await save({ data: { canvas: snapshot() } });
      setStatus(res?.saved ? "Saved for everyone" : "Saving only works while editing");
    } catch {
      setStatus("Could not save");
    }
    setTimeout(() => setStatus(null), 2500);
  }

  const chip =
    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 text-xs font-medium text-[var(--color-foreground-muted)] transition-colors hover:border-foreground/30 hover:text-foreground";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setEditing(!editing)}
        aria-pressed={editing}
        className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
          editing
            ? "border-foreground/50 text-foreground"
            : "border-[var(--color-border)] text-[var(--color-foreground-muted)] hover:border-foreground/30 hover:text-foreground"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 4v16M10 4v16M14 4v16M20 4v16M4 4h16M4 20h16" />
        </svg>
        {editing ? "Editing" : "Edit page"}
      </button>

      {editing && (
        <>
          <button
            type="button"
            onClick={() => addBlock(page, "text", { x: 0, y: bottomRow(), w: 6, h: 6 })}
            className={chip}
          >
            + Text
          </button>
          <button
            type="button"
            onClick={() => addBlock(page, "image", { x: 0, y: bottomRow(), w: 6, h: 12 })}
            className={chip}
          >
            + Image
          </button>
          <button
            type="button"
            onClick={() => addBlock(page, "video", { x: 0, y: bottomRow(), w: 6, h: 12 })}
            className={chip}
          >
            + Video
          </button>
          <button
            type="button"
            onClick={() => addBlock(page, "shape", { x: 0, y: bottomRow(), w: 12, h: 16 })}
            className={chip}
          >
            + Colour
          </button>
          <button
            type="button"
            onClick={() => addBlock(page, "rule", { x: 0, y: bottomRow(), w: 12, h: 1 })}
            className={chip}
          >
            + Line
          </button>
          <button type="button" onClick={onSave} className={chip}>
            Publish layout
          </button>
          <button type="button" onClick={reset} className={chip}>
            Reset
          </button>
          {status && (
            <span className="text-[11px] text-[var(--color-foreground-subtle)]">
              {status}
            </span>
          )}
        </>
      )}
    </div>
  );
}
