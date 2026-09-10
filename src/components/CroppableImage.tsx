import { useCallback, useEffect, useRef, useState } from "react";

/** How an image is framed inside its block: zoom plus a nudge in each axis. */
export type Crop = { zoom: number; x: number; y: number };

export const DEFAULT_CROP: Crop = { zoom: 1, x: 0, y: 0 };

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** Keeps the picture covering the frame: pan room grows with zoom. */
function clampCrop(crop: Crop): Crop {
  const zoom = clamp(crop.zoom, MIN_ZOOM, MAX_ZOOM);
  const room = ((zoom - 1) / zoom) * 50;
  return {
    zoom,
    x: clamp(crop.x, -room, room),
    y: clamp(crop.y, -room, room),
  };
}

/**
 * An image that can be repositioned and scaled inside its frame while the
 * private layout editor is on. Drag to move, scroll or use the slider to zoom.
 */
export function CroppableImage({
  src,
  alt,
  ratio,
  crop,
  editable,
  onChange,
  className,
  fill,
}: {
  src: string;
  alt: string;
  /** CSS aspect-ratio for the frame, e.g. "3 / 2". Undefined keeps the file's shape. */
  ratio?: string;
  crop?: Crop;
  editable: boolean;
  onChange?: (crop: Crop) => void;
  className?: string;
  /** The frame's own classes already set its height; make the picture cover it. */
  fill?: boolean;
}) {
  const value = clampCrop({ ...DEFAULT_CROP, ...(crop ?? {}) });
  const frameRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const stateRef = useRef({ value, editable, onChange });
  stateRef.current = { value, editable, onChange };

  const commit = useCallback((next: Crop) => {
    stateRef.current.onChange?.(clampCrop(next));
  }, []);

  // Native non-passive wheel listener so zooming does not scroll the page.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!stateRef.current.editable) return;
      e.preventDefault();
      const dy =
        e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const current = stateRef.current.value;
      commit({ ...current, zoom: current.zoom * Math.exp(-dy * 0.0015) });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [commit]);

  function onPointerDown(e: React.PointerEvent) {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const start = { x: e.clientX, y: e.clientY, crop: value };
    setDragging(true);
    const move = (ev: PointerEvent) => {
      commit({
        ...start.crop,
        x: start.crop.x + ((ev.clientX - start.x) / rect.width) * 100,
        y: start.crop.y + ((ev.clientY - start.y) / rect.height) * 100,
      });
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div className="w-full">
      <div
        ref={frameRef}
        className={`relative w-full overflow-hidden ${
          editable ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""
        } ${className ?? ""}`}
        style={ratio ? { aspectRatio: ratio } : undefined}
        onPointerDown={onPointerDown}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          draggable={false}
          className={
            ratio || fill
              ? "absolute inset-0 h-full w-full object-cover select-none"
              : "h-auto w-full select-none"
          }
          style={{
            transform: `translate(${value.x}%, ${value.y}%) scale(${value.zoom})`,
            transformOrigin: "center",
          }}
        />
      </div>
      {editable && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-[var(--color-foreground-subtle)]">
            Zoom
          </span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={value.zoom}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => commit({ ...value, zoom: Number(e.target.value) })}
            className="h-1 flex-1 accent-current"
          />
          <span className="w-10 text-right text-[10px] tabular-nums text-[var(--color-foreground-subtle)]">
            {value.zoom.toFixed(2)}×
          </span>
          <button
            type="button"
            onClick={() => commit(DEFAULT_CROP)}
            className="text-[10px] uppercase tracking-wide text-[var(--color-foreground-muted)] hover:text-foreground"
          >
            Reset crop
          </button>
        </div>
      )}
    </div>
  );
}
