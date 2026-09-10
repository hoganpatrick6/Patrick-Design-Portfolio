import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  GRID_COLUMNS,
  GUTTER,
  ROW_UNIT,
  STACK_BREAKPOINT,
  aspectToCss,
  blockStyleToCss,
  embedUrl,
  styleTouchesType,
  type CanvasBlock as CanvasBlockData,
  type Placement,
} from "../config/canvas-defaults";
import { fileToDataUrl, fileToImageDataUrl } from "../lib/media-files";
import { CroppableImage } from "./CroppableImage";
import { useCanvas } from "./CanvasProvider";

/* ------------------------------------------------------------------ */
/* Layout engine                                                       */
/* ------------------------------------------------------------------ */

type Resolved = { top: number; rows: number; order: number };

type CanvasLayout = {
  stacked: boolean;
  colWidth: number;
  resolved: Record<string, Resolved>;
  register: (id: string) => void;
  unregister: (id: string) => void;
  reportHeight: (id: string, px: number) => void;
  page: string;
};

const LayoutContext = createContext<CanvasLayout | null>(null);

function useCanvasLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("Canvas blocks must live inside <Canvas>");
  return ctx;
}

function overlapsX(a: Placement, b: Placement) {
  return a.x < b.x + b.w && b.x < a.x + a.w;
}

/* ------------------------------------------------------------------ */
/* Picking out one piece of type inside a block                        */
/* ------------------------------------------------------------------ */

/** True for a settings key that points at one line of type, not a whole block. */
export function isTextTargetId(id: string) {
  return id.includes("#");
}

/** The block a piece of type belongs to. */
export function blockIdOf(id: string) {
  return id.split("#")[0] as string;
}

function pathTo(root: HTMLElement, el: HTMLElement): string | null {
  const parts: number[] = [];
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent) return null;
    parts.unshift(Array.prototype.indexOf.call(parent.children, node));
    node = parent;
  }
  return node === root ? parts.join(".") : null;
}

function elementAt(root: HTMLElement, path: string): HTMLElement | null {
  let node: HTMLElement | null = root;
  for (const part of path.split(".")) {
    if (!node) return null;
    node = (node.children[Number(part)] as HTMLElement | undefined) ?? null;
  }
  return node;
}

/** The nearest thing around a click that actually carries words. */
function textElementFrom(root: HTMLElement, start: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = start;
  while (node && node !== root) {
    if (node.hasAttribute("data-editor-ui")) return null;
    const carriesWords = Array.from(node.childNodes).some(
      (n) => n.nodeType === 3 && (n.textContent ?? "").trim().length > 0,
    );
    if (carriesWords) return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * The page canvas: 12 columns across, a fine baseline row down. Blocks keep
 * the spot they were given and are nudged down only far enough to stay clear
 * of whatever sits above them, so nothing ever overlaps.
 */
export function Canvas({ page, children }: { page: string; children: ReactNode }) {
  const {
    editing,
    placementFor,
    blocksFor,
    isHidden,
    addBlock,
    updateBlock,
    setSelectedId,
    setPageBottom,
  } = useCanvas();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [ids, setIds] = useState<string[]>([]);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [dropping, setDropping] = useState(false);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const register = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const unregister = useCallback((id: string) => {
    setIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const reportHeight = useCallback((id: string, px: number) => {
    setHeights((prev) => (prev[id] === px ? prev : { ...prev, [id]: px }));
  }, []);

  const stacked = width > 0 && width < STACK_BREAKPOINT;
  const colWidth =
    width > 0 ? (width - GUTTER * (GRID_COLUMNS - 1)) / GRID_COLUMNS : 0;

  const { resolved, totalRows } = useMemo(() => {
    const items = ids
      .map((id) => ({ id, p: placementFor(id), h: heights[id] ?? 0 }))
      .sort((a, b) => a.p.y - b.p.y || a.p.x - b.p.x);

    const out: Record<string, Resolved> = {};
    const placed: { p: Placement; top: number; rows: number }[] = [];
    let bottom = 0;

    items.forEach((item, index) => {
      const contentRows = Math.ceil((item.h + GUTTER) / ROW_UNIT);
      const rows = Math.max(item.p.h, contentRows || 1);
      // Keep the block where it was dropped, and only slide it down far
      // enough to clear something it would actually sit on top of.
      let top = item.p.y;
      let moved = true;
      let guard = 0;
      while (moved && guard++ < 40) {
        moved = false;
        placed.forEach((prev) => {
          const clash =
            overlapsX(prev.p, item.p) &&
            top < prev.top + prev.rows &&
            top + rows > prev.top;
          if (clash) {
            top = prev.top + prev.rows;
            moved = true;
          }
        });
      }
      out[item.id] = { top, rows, order: index };
      placed.push({ p: item.p, top, rows });
      bottom = Math.max(bottom, top + rows);
    });

    return { resolved: out, totalRows: bottom };
  }, [ids, heights, placementFor]);

  const value = useMemo<CanvasLayout>(
    () => ({ stacked, colWidth, resolved, register, unregister, reportHeight, page }),
    [stacked, colWidth, resolved, register, unregister, reportHeight, page],
  );

  useEffect(() => {
    setPageBottom(page, totalRows);
  }, [page, totalRows, setPageBottom]);

  const pageBlocks = blocksFor(page).filter((b) => !isHidden(b.id));

  async function onDrop(e: React.DragEvent) {
    if (!editing) return;
    e.preventDefault();
    setDropping(false);
    const rect = wrapRef.current?.getBoundingClientRect();
    const files = Array.from(e.dataTransfer.files);
    if (!rect || !files.length) return;
    const x = Math.max(
      0,
      Math.min(GRID_COLUMNS - 6, Math.round((e.clientX - rect.left) / (colWidth + GUTTER))),
    );
    const y = Math.max(0, Math.round((e.clientY - rect.top) / ROW_UNIT));
    for (const file of files) {
      const isVideo = file.type.startsWith("video/");
      const block = addBlock(page, isVideo ? "video" : "image", { x, y, w: 6, h: 12 });
      try {
        const src = isVideo ? await fileToDataUrl(file) : await fileToImageDataUrl(file);
        updateSrc(block.id, src, file.name);
      } catch {
        /* leave the empty block in place */
      }
    }
  }

  function updateSrc(id: string, src: string, name: string) {
    updateBlock(id, { src, alt: name });
  }

  return (
    <LayoutContext.Provider value={value}>
      <div
        ref={wrapRef}
        data-canvas=""
        onDragOver={(e) => {
          if (!editing) return;
          e.preventDefault();
          setDropping(true);
        }}
        onDragLeave={() => setDropping(false)}
        onDrop={(e) => void onDrop(e)}
        onPointerDown={(e) => {
          if (editing && e.target === e.currentTarget) setSelectedId(null);
        }}
        className={`relative ${stacked ? "flex flex-col gap-10" : ""} ${
          dropping ? "outline outline-2 outline-dashed outline-foreground/40" : ""
        }`}
        style={
          stacked
            ? undefined
            : { minHeight: `${Math.max(totalRows, 8) * ROW_UNIT}px` }
        }
      >
        {editing && !stacked && <CanvasGuides />}
        {children}
        {pageBlocks.map((block) => (
          <PlacedBlock key={block.id} block={block} />
        ))}
      </div>
    </LayoutContext.Provider>
  );
}

function CanvasGuides() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <div className="canvas-row-guides absolute inset-0" />
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
          columnGap: `${GUTTER}px`,
        }}
      >
        {Array.from({ length: GRID_COLUMNS }).map((_, i) => (
          <div key={i} className="h-full bg-foreground/[0.035]" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Blocks                                                              */
/* ------------------------------------------------------------------ */

type DragMode = "move" | "size-x" | "size-y" | "size-xy";

/**
 * One block on the canvas. Wrap page content in it to make that content
 * movable, resizable and stylable.
 */
export function CanvasBlock({
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
  onDelete?: () => void;
}) {
  const {
    editing,
    placementFor,
    setPlacement,
    isHidden,
    hideBlock,
    selectedId,
    setSelectedId,
    styleFor,
    styles,
  } = useCanvas();
  const { stacked, colWidth, resolved, register, unregister, reportHeight } =
    useCanvasLayout();

  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const touchedRef = useRef<{ el: HTMLElement; css: string }[]>([]);
  const justDragged = useRef(false);
  const [drag, setDrag] = useState<DragMode | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);

  const placement = placementFor(id);
  const spot = resolved[id];
  const selected = editing && selectedId === id;
  const style = styleFor(id);
  const hidden = isHidden(id);

  useEffect(() => {
    if (hidden) return;
    register(id);
    return () => unregister(id);
  }, [id, hidden, register, unregister]);

  // Measure content so the block always reserves the room it needs.
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el || hidden) return;
    const ro = new ResizeObserver(() => {
      reportHeight(id, el.getBoundingClientRect().height);
    });
    ro.observe(el);
    reportHeight(id, el.getBoundingClientRect().height);
    return () => ro.disconnect();
  }, [id, hidden, reportHeight]);

  // Paint the settings of any single piece of type onto the words themselves,
  // and outline whichever piece is currently picked.
  useEffect(() => {
    touchedRef.current.forEach(({ el, css }) => {
      el.style.cssText = css;
      el.removeAttribute("data-type-selected");
    });
    touchedRef.current = [];
    const root = innerRef.current;
    if (!root) return;
    const touched: { el: HTMLElement; css: string }[] = [];
    const prefix = `${id}#`;
    Object.entries(styles).forEach(([key, value]) => {
      if (!key.startsWith(prefix)) return;
      const el = elementAt(root, key.slice(prefix.length));
      if (!el) return;
      touched.push({ el, css: el.style.cssText });
      Object.assign(el.style, blockStyleToCss(value) as Record<string, string>);
    });
    if (editing && selectedId?.startsWith(prefix)) {
      const el = elementAt(root, selectedId.slice(prefix.length));
      if (el) {
        el.setAttribute("data-type-selected", "");
        if (!touched.some((t) => t.el === el)) touched.push({ el, css: el.style.cssText });
      }
    }
    touchedRef.current = touched;
  });


  const startDrag = useCallback(
    (event: React.PointerEvent, mode: DragMode) => {
      if (!editing || stacked || colWidth <= 0) return;
      event.preventDefault();
      event.stopPropagation();
      const start = { ...placement };
      const startX = event.clientX;
      const startY = event.clientY;
      const step = colWidth + GUTTER;
      setDrag(mode);
      setSelectedId(id);
      let moved = false;
      let last = start;

      function onMove(e: PointerEvent) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
        const cols = Math.round(dx / step);
        const rows = Math.round(dy / ROW_UNIT);
        let next: Placement = start;
        if (mode === "move") {
          next = {
            ...start,
            x: Math.min(Math.max(start.x + cols, 0), GRID_COLUMNS - start.w),
            y: Math.max(0, start.y + rows),
          };
        } else {
          next = {
            ...start,
            w:
              mode === "size-y"
                ? start.w
                : Math.min(Math.max(start.w + cols, 1), GRID_COLUMNS - start.x),
            h:
              mode === "size-x" ? start.h : Math.max(1, start.h + rows),
          };
        }
        if (
          next.x !== last.x ||
          next.y !== last.y ||
          next.w !== last.w ||
          next.h !== last.h
        ) {
          last = next;
          setPlacement(id, next);
        }
        // Keep the block under the pointer between snap points.
        if (mode === "move") {
          setOffset({ x: dx - cols * step, y: dy - rows * ROW_UNIT });
        } else {
          setOffset(null);
        }
      }

      function onUp() {
        setDrag(null);
        setOffset(null);
        if (!moved) setSelectedId(id);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      }

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [colWidth, editing, id, placement, setPlacement, setSelectedId, stacked],
  );

  if (hidden) return null;

  const styled = blockStyleToCss(style);
  const positioned: CSSProperties = stacked
    ? { order: spot?.order ?? 0 }
    : {
        position: "absolute",
        left: `calc((100% + ${GUTTER}px) * ${placement.x / GRID_COLUMNS})`,
        width: `calc((100% + ${GUTTER}px) * ${placement.w / GRID_COLUMNS} - ${GUTTER}px)`,
        top: `${(spot?.top ?? placement.y) * ROW_UNIT}px`,
        minHeight: `${Math.max(placement.h, spot?.rows ?? 0) * ROW_UNIT}px`,
        transform: offset ? `translate(${offset.x}px, ${offset.y}px)` : undefined,
      };

  return (
    <div
      ref={outerRef}
      data-canvas-block={id}
      data-dragging={drag ? "" : undefined}
      data-styled-font={styleTouchesType(style) ? "" : undefined}
      data-styled-color={style?.color ? "" : undefined}
      className={`canvas-block ${editing ? "is-editing" : ""} ${
        selected ? "is-selected" : ""
      } ${drag ? "is-dragging" : ""} ${className}`}
      style={{ ...positioned, ...styled }}
      onPointerDown={(e) => {
        if (!editing) return;
        const target = e.target as HTMLElement;
        if (target.closest("input, textarea, select, button, a, [data-no-drag]")) return;
        startDrag(e, "move");
      }}
    >
      {editing && (
        <>
          <button
            type="button"
            data-editor-ui=""
            data-no-drag=""
            onPointerDown={(e) => startDrag(e, "move")}
            className="canvas-chip absolute -top-6 left-0 z-30 cursor-grab select-none"
            title={`Drag to move ${label}`}
          >
            ⠿ {label}
          </button>
          <button
            type="button"
            data-editor-ui=""
            data-no-drag=""
            onClick={() => (onDelete ? onDelete() : hideBlock(id))}
            aria-label={`Remove ${label}`}
            className="canvas-chip absolute -top-6 right-0 z-30"
          >
            ✕
          </button>
          {!stacked && (
            <>
              <span
                data-editor-ui=""
                data-no-drag=""
                onPointerDown={(e) => startDrag(e, "size-x")}
                className="canvas-handle absolute -right-1.5 top-1/2 h-10 w-3 -translate-y-1/2 cursor-ew-resize"
              />
              <span
                data-editor-ui=""
                data-no-drag=""
                onPointerDown={(e) => startDrag(e, "size-y")}
                className="canvas-handle absolute -bottom-1.5 left-1/2 h-3 w-10 -translate-x-1/2 cursor-ns-resize"
              />
              <span
                data-editor-ui=""
                data-no-drag=""
                onPointerDown={(e) => startDrag(e, "size-xy")}
                className="canvas-handle absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-nwse-resize"
              />
            </>
          )}
        </>
      )}
      <div ref={innerRef}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Blocks added through the editor                                     */
/* ------------------------------------------------------------------ */

function PlacedBlock({ block }: { block: CanvasBlockData }) {
  const { removeBlock } = useCanvas();
  const label =
    block.kind === "video" ? "Video" : block.kind === "text" ? "Text" : "Image";
  return (
    <CanvasBlock id={block.id} label={label} onDelete={() => removeBlock(block.id)}>
      {block.kind === "text" ? (
        <TextBlockView block={block} />
      ) : (
        <MediaBlockView block={block} />
      )}
    </CanvasBlock>
  );
}

function TextBlockView({ block }: { block: CanvasBlockData }) {
  const { editing, updateBlock, selectedId } = useCanvas();
  const role = block.role || "body";
  const text = block.text ?? "";
  const selected = selectedId === block.id;

  if (!editing) {
    if (!text.trim()) return null;
    return <div className={`type-${role} whitespace-pre-wrap`}>{text}</div>;
  }

  return (
    <textarea
      data-no-drag=""
      value={text}
      rows={Math.max(2, text.split("\n").length)}
      placeholder="Write here…"
      onChange={(e) => updateBlock(block.id, { text: e.target.value })}
      className={`type-${role} w-full resize-none rounded-sm border bg-transparent p-1 text-inherit outline-none ${
        selected ? "border-foreground/40" : "border-transparent"
      }`}
      style={{ font: "inherit", color: "inherit", minHeight: "3em" }}
    />
  );
}

function MediaBlockView({ block }: { block: CanvasBlockData }) {
  const { editing, updateBlock, selectedId } = useCanvas();
  const selected = selectedId === block.id;
  const ratio = aspectToCss(block.aspect);
  const frame = block.kind === "video" ? embedUrl(block.src) : null;

  return (
    <figure className="w-full">
      {block.src && block.kind === "image" ? (
        <CroppableImage
          src={block.src}
          alt={block.alt}
          ratio={ratio}
          crop={block.crop}
          editable={editing && selected}
          onChange={(crop) => updateBlock(block.id, { crop })}
          className="bg-foreground/[0.05]"
        />
      ) : (
        <div
          className="relative w-full overflow-hidden bg-foreground/[0.05]"
          style={ratio ? { aspectRatio: ratio } : undefined}
        >
          {editing && <div className="absolute inset-0 z-10" aria-hidden="true" />}
          {!block.src ? (
            <div className="flex h-full min-h-32 items-center justify-center px-4 text-center text-xs uppercase tracking-wide text-[var(--color-foreground-subtle)]">
              {editing
                ? "Drop a file here, or use the panel to add one"
                : block.kind === "video"
                  ? "Video"
                  : "Image"}
            </div>
          ) : frame ? (
            <iframe
              src={frame}
              title={block.alt || "Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            <video
              src={block.src}
              controls={!editing}
              playsInline
              className={`w-full ${ratio ? "absolute inset-0 h-full object-cover" : "h-auto"}`}
            />
          )}
        </div>
      )}
      {block.caption && (
        <figcaption className="mt-3 text-xs text-[var(--color-foreground-subtle)]">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}
