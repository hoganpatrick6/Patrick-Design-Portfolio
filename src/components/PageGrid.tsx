import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { GRID_COLUMNS, GRID_ROW_HEIGHT } from "../config/layout-defaults";
import { BLOCK_STYLE_ROLES, ROLE_LABELS } from "../config/type-defaults";
import { useLayout } from "./LayoutProvider";

/**
 * The 12-column design grid that every page block snaps to.
 */
export function PageGrid({ children }: { children: ReactNode }) {
  const { editing } = useLayout();

  return (
    <div className="relative">
      {editing && <GridGuides />}
      <div
        data-page-grid=""
        className="relative grid grid-cols-1 items-start gap-x-12 gap-y-16 md:grid-cols-12"
      >
        {children}
      </div>
    </div>
  );
}

function GridGuides() {
  return (
    <div
      aria-hidden
      className="layout-grid-guides pointer-events-none absolute inset-0 z-0 hidden md:block"
    >
      <div className="absolute inset-0 grid grid-cols-12 gap-x-12">
        {Array.from({ length: GRID_COLUMNS }).map((_, i) => (
          <div
            key={i}
            className="h-full bg-foreground/[0.04] outline outline-1 outline-foreground/10"
          />
        ))}
      </div>
      <div className="layout-row-guides absolute inset-0" />
    </div>
  );
}

type Mode = "move" | "resize" | null;

type ActiveDrag = {
  mode: Exclude<Mode, null>;
  startX: number;
  startY: number;
  pointerX: number;
  pointerY: number;
  originLeft: number;
  originTop: number;
};

/**
 * A block of content placed on the design grid. In editing mode it can be
 * dragged to a new column and resized in column steps — always snapping.
 */
export function GridBlock({
  id,
  label,
  children,
  className = "",
  onDelete,
}: {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
  /** Custom removal handler; falls back to hiding the block. */
  onDelete?: () => void;
}) {
  const {
    editing,
    placementFor,
    setPlacement,
    setOrder,
    hideBlock,
    isHidden,
    selectedId,
    setSelectedId,
    roleFor,
    setBlockRole,
  } = useLayout();
  const role = roleFor(id);
  const selected = editing && selectedId === id;
  const placement = placementFor(id);
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>(null);
  const draggingRef = useRef(false);
  const activeDragRef = useRef<ActiveDrag | null>(null);
  const frameRef = useRef<number | null>(null);

  const positionDraggedBlock = useCallback(() => {
    const el = ref.current;
    const drag = activeDragRef.current;
    if (!el || !drag || drag.mode !== "move") return;

    // Measure the block's snapped layout position without its visual offset,
    // then offset it back under the pointer. This keeps the active block
    // continuous while the grid and its neighbours snap underneath it.
    const previousTransform = el.style.transform;
    el.style.transform = "";
    const natural = el.getBoundingClientRect();
    const x = drag.originLeft + drag.pointerX - drag.startX - natural.left;
    const y = drag.originTop + drag.pointerY - drag.startY - natural.top;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (previousTransform && !draggingRef.current) {
      el.style.transform = previousTransform;
    }
  }, []);

  // FLIP: animate this block from its previous position to the new one so
  // neighbouring blocks glide out of the way instead of jumping.
  const prevRect = useRef<DOMRect | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (draggingRef.current) {
      positionDraggedBlock();
      return;
    }
    const next = el.getBoundingClientRect();
    const prev = prevRect.current;
    prevRect.current = next;
    if (!prev || draggingRef.current) return;
    const dx = prev.left - next.left;
    const dy = prev.top - next.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    el.dataset["flip"] = "";
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    requestAnimationFrame(() => {
      el.dataset["flip"] = "animating";
      el.style.transform = "";
    });
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onEnd = () => {
      delete el.dataset["flip"];
      delete el.dataset["settling"];
      el.style.transform = "";
    };
    el.addEventListener("transitionend", onEnd);
    return () => el.removeEventListener("transitionend", onEnd);
  }, []);

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const startDrag = useCallback(
    (event: React.PointerEvent, dragMode: Exclude<Mode, null>) => {
      event.preventDefault();
      event.stopPropagation();
      const el = ref.current;
      const grid = el?.closest<HTMLElement>("[data-page-grid]");
      if (!el || !grid) return;
      const dragEl = el;
      const dragGrid = grid;

      const gridRect = dragGrid.getBoundingClientRect();
      const styles = getComputedStyle(dragGrid);
      const colGap = parseFloat(styles.columnGap) || 0;
      const colWidth =
        (gridRect.width - colGap * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

      const startX = event.clientX;
      const startY = event.clientY;
      const start = { ...placement };
      const origin = dragEl.getBoundingClientRect();
      setMode(dragMode);
      draggingRef.current = true;
      activeDragRef.current = {
        mode: dragMode,
        startX,
        startY,
        pointerX: startX,
        pointerY: startY,
        originLeft: origin.left,
        originTop: origin.top,
      };
      dragEl.dataset["dragging"] = "";

      let lastColStart = start.colStart;
      let lastColSpan = start.colSpan;
      let lastOrder = "";

      /** Live sibling midpoints, measured from layout (ignores animations). */
      function siblings() {
        return Array.from(
          dragGrid.querySelectorAll<HTMLElement>(":scope > [data-grid-block]"),
        )
          .map((node) => ({
            id: node.dataset["gridBlock"] ?? "",
            mid: node.offsetTop + node.offsetHeight / 2,
          }))
          .sort((a, b) => a.mid - b.mid);
      }

      function applyPointerPosition() {
        frameRef.current = null;
        const drag = activeDragRef.current;
        if (!drag) return;
        const dxCols = Math.round((drag.pointerX - startX) / (colWidth + colGap));
        if (dragMode === "resize") {
          const nextSpan = Math.min(
            Math.max(start.colSpan + dxCols, 1),
            GRID_COLUMNS - start.colStart + 1,
          );
          if (nextSpan !== lastColSpan) {
            lastColSpan = nextSpan;
            setPlacement(id, { ...start, colSpan: nextSpan });
          }
          return;
        }

        const nextStart = Math.min(
          Math.max(start.colStart + dxCols, 1),
          GRID_COLUMNS - start.colSpan + 1,
        );
        if (nextStart !== lastColStart) {
          lastColStart = nextStart;
          setPlacement(id, { ...start, colStart: nextStart });
        }
        positionDraggedBlock();

        // Vertical: swap places the moment the pointer passes a neighbour.
        const all = siblings();
        const pointerY =
          drag.pointerY - dragGrid.getBoundingClientRect().top + dragGrid.scrollTop;
        const snappedPointerY = Math.round(pointerY / GRID_ROW_HEIGHT) * GRID_ROW_HEIGHT;
        const others = all.filter((s) => s.id !== id);
        const target = others.filter((s) => s.mid < snappedPointerY).length;
        const next = others.map((s) => s.id);
        next.splice(target, 0, id);
        const orderKey = next.join("\u0000");
        if (orderKey !== lastOrder) {
          lastOrder = orderKey;
          setOrder(next);
        }
      }

      function onMove(e: PointerEvent) {
        const drag = activeDragRef.current;
        if (!drag) return;
        drag.pointerX = e.clientX;
        drag.pointerY = e.clientY;
        if (frameRef.current === null) {
          frameRef.current = requestAnimationFrame(applyPointerPosition);
        }
      }

      function onUp() {
        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
          applyPointerPosition();
        }
        setMode(null);
        draggingRef.current = false;
        activeDragRef.current = null;
        delete dragEl.dataset["dragging"];
        if (dragMode === "move" && dragEl.style.transform) {
          dragEl.dataset["settling"] = "";
          requestAnimationFrame(() => {
            dragEl.style.transform = "";
          });
        }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      }

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [id, placement, positionDraggedBlock, setPlacement, setOrder],
  );

  if (isHidden(id)) return null;

  return (
    <div
      ref={ref}
      data-grid-block={id}
      onClick={(e) => {
        if (!editing) return;
        if ((e.target as HTMLElement).closest("button, a, input, textarea"))
          return;
        setSelectedId(selected ? null : id);
      }}
      className={`grid-block relative ${role ? `type-${role}` : ""} ${
        editing
          ? `cursor-pointer outline-dashed outline-1 outline-offset-8 ${
              selected
                ? "outline-foreground/70"
                : mode
                  ? "outline-foreground/60"
                  : "outline-foreground/25"
            }`
          : ""
      } ${className}`}
      style={
        {
          "--block-col-start": placement.colStart,
          "--block-col-span": placement.colSpan,
          order: placement.order,
        } as React.CSSProperties
      }
    >

      {editing && (
        <>
          <button
            type="button"
            data-editor-ui=""
            onPointerDown={(e) => startDrag(e, "move")}
            className="absolute -top-7 left-0 z-30 hidden cursor-grab select-none items-center gap-1 rounded-full border border-[var(--color-border)] bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-foreground-muted)] md:inline-flex"
            title={`Drag to move ${label}`}
          >
            ⠿ {label}
            <span className="tabular-nums opacity-60">
              C{placement.colStart}–{placement.colStart + placement.colSpan - 1}
              {placement.row ? ` · R${placement.row}` : ""}
            </span>
          </button>
          <button
            type="button"
            data-editor-ui=""
            onClick={() => (onDelete ? onDelete() : hideBlock(id))}
            aria-label={`Delete ${label}`}
            title={`Delete ${label}`}
            className="absolute -top-7 right-0 z-30 hidden rounded-full border border-[var(--color-border)] bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-foreground-muted)] transition-colors hover:border-foreground/40 hover:text-foreground md:inline-flex"
          >
            ✕ Delete
          </button>
          <button
            type="button"
            data-editor-ui=""
            onPointerDown={(e) => startDrag(e, "resize")}
            aria-label={`Resize ${label} horizontally`}
            className="absolute -right-3 top-1/2 z-30 hidden h-10 w-2 -translate-y-1/2 cursor-ew-resize rounded-full bg-foreground/30 md:block"
          />
        </>
      )}
      {selected && (
        <div data-editor-ui="" className="mb-2 flex flex-wrap items-center gap-1">
          <span className="mr-1 text-[10px] uppercase tracking-wide text-[var(--color-foreground-subtle)]">
            Style
          </span>
          {[...BLOCK_STYLE_ROLES, "display" as const].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setBlockRole(id, r)}
              className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                role === r
                  ? "border-foreground/50 text-foreground"
                  : "border-[var(--color-border)] text-[var(--color-foreground-muted)] hover:border-foreground/30"
              }`}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setBlockRole(id, null)}
            className="ml-auto rounded-full border border-transparent px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-foreground-muted)] hover:text-foreground"
          >
            Original
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

