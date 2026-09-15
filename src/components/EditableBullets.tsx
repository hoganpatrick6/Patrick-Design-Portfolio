import { useCallback, useEffect, useState } from "react";
import { useCanvas } from "./CanvasProvider";
import { SITE_KEYS, siteContent, writeSiteValue } from "../lib/site-content";

const STORAGE_PREFIX = "bullets:";

/**
 * A bulleted list that can be edited (duplicate / add above / add below /
 * delete / retype) while the private layout editor is on. Edits are stored
 * in the browser so they survive reloads for the editor.
 */
export function EditableBullets({ id, bullets }: { id: string; bullets: string[] }) {
  const { editing } = useCanvas();
  const [items, setItems] = useState<string[]>(bullets);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + id);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignore malformed storage */
    }
    // Anything saved for the whole site wins over this browser's copy.
    void siteContent().then((values) => {
      const remote = values[SITE_KEYS.bullets(id)];
      if (Array.isArray(remote)) setItems(remote as string[]);
    });
  }, [id]);

  const commit = useCallback(
    (next: string[]) => {
      setItems(next);
      try {
        localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      writeSiteValue(SITE_KEYS.bullets(id), next);
    },
    [id],
  );

  const insertAt = (index: number, text: string) => {
    const next = [...items];
    next.splice(index, 0, text);
    commit(next);
  };

  const removeAt = (index: number) => commit(items.filter((_, i) => i !== index));

  const updateAt = (index: number, text: string) =>
    commit(items.map((item, i) => (i === index ? text : item)));

  const actionProps = {
    type: "button" as const,
    "data-editor-ui": "",
    "data-no-drag": "",
    // Keep the caret where it is so the first click already fires the action.
    onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    className:
      "rounded-full border border-[var(--color-border)] px-2 py-1 hover:text-foreground",
  };

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {items.map((b, j) => (
          <li key={j} className="group relative flex gap-3 type-body text-foreground">
            <span
              aria-hidden
              className="mt-2 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-[var(--color-foreground-muted)]"
            />
            {editing ? (
              <span className="flex-1 space-y-2">
                <textarea
                  value={b}
                  rows={Math.max(2, Math.ceil(b.length / 70))}
                  data-editor-ui=""
                  data-no-drag=""
                  onChange={(e) => updateAt(j, e.target.value)}
                  className="type-body w-full resize-y rounded-sm border border-[var(--color-border)] bg-transparent p-2 text-foreground outline-none focus:border-foreground"
                />
                <span
                  data-editor-ui=""
                  data-no-drag=""
                  className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-[var(--color-foreground-muted)]"
                >
                  <button {...actionProps} onClick={() => insertAt(j, "New bullet")}>
                    + Above
                  </button>
                  <button {...actionProps} onClick={() => insertAt(j + 1, "New bullet")}>
                    + Below
                  </button>
                  <button {...actionProps} onClick={() => insertAt(j + 1, b)}>
                    Duplicate
                  </button>
                  <button {...actionProps} onClick={() => removeAt(j)}>
                    ✕ Delete
                  </button>
                </span>
              </span>
            ) : (
              <span>{b}</span>
            )}
          </li>
        ))}
      </ul>
      {editing && (
        <button
          {...actionProps}
          onClick={() => insertAt(items.length, "New bullet")}
          className="rounded-full border border-[var(--color-border)] px-3 py-1 text-[11px] uppercase tracking-wide text-[var(--color-foreground-muted)] hover:text-foreground"
        >
          + Bullet
        </button>
      )}
    </div>
  );
}

