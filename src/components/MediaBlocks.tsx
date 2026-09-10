import { useEffect, useRef, useState } from "react";
import {
  ASPECT_RATIOS,
  aspectToCss,
  embedUrl,
  type MediaBlock as MediaBlockType,
} from "../config/media-defaults";
import { BLOCK_STYLE_ROLES, ROLE_LABELS } from "../config/type-defaults";
import { CroppableImage } from "./CroppableImage";
import { useLayout } from "./LayoutProvider";
import { useMedia } from "./MediaProvider";
import { GridBlock } from "./PageGrid";

/**
 * Renders every image / video block placed on a page. Each one sits on the
 * 12-column grid, so it can be dragged and resized like any other block.
 */
export function MediaBlocks({ page }: { page: string }) {
  const { blocksFor, removeBlock } = useMedia();
  const { editing } = useLayout();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const blocks = blocksFor(page);

  useEffect(() => {
    if (!editing || !selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      removeBlock(selectedId);
      setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, selectedId, removeBlock]);

  useEffect(() => {
    if (!editing) setSelectedId(null);
  }, [editing]);

  if (!blocks.length) return null;
  return (
    <>
      {blocks.map((block, i) => (
        <GridBlock
          key={block.id}
          id={block.id}
          label={`${
            block.kind === "video" ? "Video" : block.kind === "text" ? "Text" : "Image"
          } ${i + 1}`}
          onDelete={() => removeBlock(block.id)}
        >
          {block.kind === "text" ? (
            <TextFigure
              block={block}
              selected={selectedId === block.id}
              onSelect={() => setSelectedId(selectedId === block.id ? null : block.id)}
            />
          ) : (
            <MediaFigure
              block={block}
              selected={selectedId === block.id}
              onSelect={() => setSelectedId(selectedId === block.id ? null : block.id)}
            />
          )}
        </GridBlock>
      ))}
    </>
  );
}

const TEXT_STYLES: { value: string; label: string }[] = [
  ...BLOCK_STYLE_ROLES.map((value) => ({ value, label: ROLE_LABELS[value] })),
  { value: "display", label: ROLE_LABELS.display },
];

/** A block of copy placed on the grid, styled by one of the type roles. */
function TextFigure({
  block,
  selected,
  onSelect,
}: {
  block: MediaBlockType;
  selected: boolean;
  onSelect: () => void;
}) {
  const { editing } = useLayout();
  const { updateBlock, removeBlock } = useMedia();
  const role = block.role || "body";
  const text = block.text ?? "";

  if (!editing) {
    if (!text.trim()) return null;
    return <div className={`type-${role} whitespace-pre-wrap`}>{text}</div>;
  }

  return (
    <div
      className="cursor-pointer"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        if (!selected) onSelect();
      }}
    >
      {selected && (
        <div className="mb-2 flex flex-wrap items-center gap-1">
          <span className="mr-1 text-[10px] uppercase tracking-wide text-[var(--color-foreground-subtle)]">
            Style
          </span>
          {TEXT_STYLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => updateBlock(block.id, { role: r.value })}
              className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                role === r.value
                  ? "border-foreground/50 text-foreground"
                  : "border-[var(--color-border)] text-[var(--color-foreground-muted)] hover:border-foreground/30"
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => removeBlock(block.id)}
            className="ml-auto rounded-full border border-transparent px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-foreground-muted)] hover:text-foreground"
          >
            Remove
          </button>
        </div>
      )}
      <textarea
        value={text}
        rows={Math.max(3, text.split("\n").length + 1)}
        placeholder="Write your text here…"
        onFocus={() => {
          if (!selected) onSelect();
        }}
        onChange={(e) => updateBlock(block.id, { text: e.target.value })}
        className={`type-${role} w-full resize-y rounded border border-dashed bg-transparent p-2 text-foreground outline-none ${
          selected
            ? "border-foreground/50"
            : "border-[var(--color-border)] focus:border-foreground/40"
        }`}
      />
      {selected && (
        <p className="mt-1 text-[10px] text-[var(--color-foreground-subtle)]">
          Pick a style above — it uses the saved settings for that style.
        </p>
      )}
    </div>
  );
}

/** Downscales an image file and returns a compact data URL. */
async function fileToImageDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  if (file.type === "image/svg+xml" || file.type === "image/gif") return raw;

  const img = new Image();
  img.src = raw;
  try {
    await img.decode();
  } catch {
    return raw;
  }
  const max = 1800;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function MediaFigure({
  block,
  selected,
  onSelect,
}: {
  block: MediaBlockType;
  selected: boolean;
  onSelect: () => void;
}) {
  const { editing } = useLayout();
  const { removeBlock, updateBlock } = useMedia();
  const replaceRef = useRef<HTMLInputElement>(null);
  const ratio = aspectToCss(block.aspect);
  const frame = embedUrl(block.src);

  async function onReplace(file: File | undefined) {
    if (!file) return;
    if (block.kind === "image") {
      const src = await fileToImageDataUrl(file);
      updateBlock(block.id, { src, alt: block.alt || file.name });
    } else {
      if (file.size > 12 * 1024 * 1024) return;
      const src = await fileToDataUrl(file);
      updateBlock(block.id, { src });
    }
  }

  return (
    <figure
      className={`w-full ${editing ? "cursor-pointer" : ""}`}
      onClick={
        editing
          ? (e) => {
              if ((e.target as HTMLElement).closest("input,button")) return;
              onSelect();
            }
          : undefined
      }
    >
      {editing && selected && (
        <div className="mb-2 flex items-center gap-2">
          <input
            ref={replaceRef}
            type="file"
            accept={block.kind === "video" ? "video/*" : "image/*"}
            className="hidden"
            onChange={(e) => {
              void onReplace(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => replaceRef.current?.click()}
            className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-foreground transition-colors hover:border-foreground/30"
          >
            Replace {block.kind}
          </button>
          <button
            type="button"
            onClick={() => removeBlock(block.id)}
            className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-foreground transition-colors hover:border-foreground/30"
          >
            Delete block
          </button>
          <span className="text-[10px] text-[var(--color-foreground-subtle)]">
            or press Delete
          </span>
        </div>
      )}
      {block.src && block.kind === "image" ? (
        <div
          className={
            editing && selected ? "ring-2 ring-foreground/60" : undefined
          }
        >
          <CroppableImage
            src={block.src}
            alt={block.alt}
            ratio={ratio}
            crop={block.crop}
            editable={!!editing && selected}
            onChange={(crop) => updateBlock(block.id, { crop })}
            className="bg-foreground/[0.05]"
          />
        </div>
      ) : (
      <div
        className={`relative w-full overflow-hidden bg-foreground/[0.05] ${
          editing && selected ? "ring-2 ring-foreground/60" : ""
        }`}
        style={ratio ? { aspectRatio: ratio } : undefined}
      >
        {editing && (
          <div className="absolute inset-0 z-10" aria-hidden="true" />
        )}
        {!block.src ? (
          <div className="flex h-full min-h-40 items-center justify-center text-xs uppercase tracking-wide text-[var(--color-foreground-subtle)]">
            {editing
              ? block.kind === "video"
                ? "Upload a video or paste a link below"
                : "Upload an image or paste a link below"
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
            controls
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
      {editing && <MediaFields block={block} />}
    </figure>
  );
}

function MediaFields({ block }: { block: MediaBlockType }) {
  const { updateBlock, removeBlock } = useMedia();
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);
  const input =
    "w-full rounded border border-[var(--color-border)] bg-background px-2 py-1 text-xs text-foreground";

  async function onFile(file: File | undefined) {
    if (!file) return;
    setNote("Loading…");
    try {
      if (block.kind === "image") {
        const src = await fileToImageDataUrl(file);
        updateBlock(block.id, { src, alt: block.alt || file.name });
      } else {
        if (file.size > 12 * 1024 * 1024) {
          setNote("Video is too large to store — paste a link instead");
          return;
        }
        const src = await fileToDataUrl(file);
        updateBlock(block.id, { src });
      }
      setNote(null);
    } catch {
      setNote("Could not read that file");
    }
  }

  return (
    <div className="mt-3 space-y-2 rounded-md border border-dashed border-[var(--color-border)] p-3">
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={block.kind === "video" ? "video/*" : "image/*"}
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
          Upload from computer
        </button>
        {block.src && (
          <button
            type="button"
            onClick={() => updateBlock(block.id, { src: "" })}
            className="text-[10px] uppercase tracking-wide text-[var(--color-foreground-muted)] hover:text-foreground"
          >
            Clear
          </button>
        )}
        {note && (
          <span className="text-[10px] text-[var(--color-foreground-subtle)]">{note}</span>
        )}
      </div>
      <input
        className={input}
        value={block.src.startsWith("data:") ? "" : block.src}
        placeholder={
          block.src.startsWith("data:")
            ? "Uploaded file"
            : block.kind === "video"
              ? "…or paste a link (MP4, YouTube, Vimeo)"
              : "…or paste an image link"
        }
        onChange={(e) => updateBlock(block.id, { src: e.target.value })}
      />
      <div className="flex gap-2">
        <input
          className={input}
          value={block.alt}
          placeholder="Description for screen readers"
          onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
        />
        <input
          className={input}
          value={block.caption}
          placeholder="Caption (optional)"
          onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
        />
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {ASPECT_RATIOS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => updateBlock(block.id, { aspect: r })}
            className={`rounded-full border px-2 py-0.5 text-[10px] tabular-nums transition-colors ${
              block.aspect === r
                ? "border-foreground/50 text-foreground"
                : "border-[var(--color-border)] text-[var(--color-foreground-muted)] hover:border-foreground/30"
            }`}
          >
            {r}
          </button>
        ))}
        <button
          type="button"
          onClick={() => removeBlock(block.id)}
          className="ml-auto rounded-full border border-transparent px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-foreground-muted)] hover:text-foreground"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
