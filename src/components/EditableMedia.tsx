import { useRef, useState } from "react";
import { embedUrl } from "../config/canvas-defaults";
import { fileToDataUrl, fileToImageDataUrl } from "../lib/media-files";
import { CroppableImage } from "./CroppableImage";
import { useCanvas } from "./CanvasProvider";

/**
 * Wraps a picture that is part of the page design so it can be swapped for a
 * new image, GIF or video while Layout editing is on. The swap is remembered
 * per id, so the same picture updates everywhere it appears.
 */
export function EditableMedia({
  id,
  src,
  alt,
  className,
  width,
  height,
  eager = false,
}: {
  id: string;
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  eager?: boolean;
}) {
  const { editing, overrideFor, setOverride, clearOverride } = useCanvas();
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);
  const override = overrideFor(id);
  const current = override?.src || src;
  const kind = override?.kind ?? "image";
  const frame = kind === "video" ? embedUrl(current) : null;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setNote("Loading…");
    try {
      if (file.type.startsWith("video/")) {
        if (file.size > 12 * 1024 * 1024) {
          setNote("Video is too large to store — paste a link instead");
          return;
        }
        setOverride(id, { kind: "video", src: await fileToDataUrl(file) });
      } else {
        setOverride(id, { kind: "image", src: await fileToImageDataUrl(file) });
      }
      setNote(null);
    } catch {
      setNote("Could not read that file");
    }
  }

  const media =
    kind === "video" ? (
      frame ? (
        <div className={`relative overflow-hidden ${className ?? ""}`}>
          <iframe
            src={frame}
            title={alt}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      ) : (
        <video
          src={current}
          controls={!editing}
          autoPlay
          muted
          loop
          playsInline
          className={className}
        />
      )
    ) : editing ? (
      <CroppableImage
        src={current}
        alt={alt}
        crop={override?.crop}
        editable
        fill
        onChange={(crop) =>
          setOverride(id, { kind: "image", src: current, ...override, crop })
        }
        className={className}
      />
    ) : override?.crop ? (
      <div className={`relative overflow-hidden ${className ?? ""}`}>
        <img
          src={current}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          width={width}
          height={height}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            transform: `translate(${override.crop.x}%, ${override.crop.y}%) scale(${override.crop.zoom})`,
            transformOrigin: "center",
          }}
        />
      </div>
    ) : (
      <img
        src={current}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        width={width}
        height={height}
        className={className}
      />
    );

  if (!editing) return media;

  return (
    <div
      className="relative"
      onClick={(e) => {
        // Keep every click inside this editor from reaching the surrounding
        // project Link (would navigate away). The Replace button also needs
        // preventDefault because it sits inside the link's anchor. Only the
        // hidden file input keeps its default behavior so the picker opens.
        e.stopPropagation();
        if (!(e.target as HTMLElement).closest("input[type=file]")) {
          e.preventDefault();
        }
      }}
    >
      {media}
      <div className="mt-2 flex flex-wrap items-center gap-2 rounded bg-background/85 p-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-foreground transition-colors hover:border-foreground/30"
        >
          Replace
        </button>
        <input
          className="min-w-0 flex-1 rounded border border-[var(--color-border)] bg-background px-2 py-1 text-xs text-foreground"
          value={
            override && !override.src.startsWith("data:") ? override.src : ""
          }
          placeholder="…or paste an image, GIF or video link"
          onChange={(e) => {
            const value = e.target.value;
            const isVideo =
              /\.(mp4|webm|mov|m4v)(\?|$)/i.test(value) || !!embedUrl(value);
            setOverride(id, { kind: isVideo ? "video" : "image", src: value });
          }}
        />
        {override && (
          <button
            type="button"
            onClick={() => clearOverride(id)}
            className="text-[10px] uppercase tracking-wide text-[var(--color-foreground-muted)] hover:text-foreground"
          >
            Original
          </button>
        )}
        {note && (
          <span className="text-[10px] text-[var(--color-foreground-subtle)]">
            {note}
          </span>
        )}
      </div>
    </div>
  );
}
