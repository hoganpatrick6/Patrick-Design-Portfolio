import { useEffect, useRef, useState } from "react";
import {
  ASPECT_RATIOS,
  BLOCK_COLORS,
  SHAPE_FILLS,
  type AlignValue,
  type BlockStyle,
  type TransformValue,
} from "../config/canvas-defaults";
import {
  BLOCK_STYLE_ROLES,
  FONT_STACKS,
  ROLE_LABELS,
  type RoleKey,
} from "../config/type-defaults";
import {
  CURATED_GOOGLE_FONTS,
  familyFromStack,
  fontStackFor,
  loadGoogleFont,
  readCustomFonts,
  writeCustomFonts,
} from "../lib/google-fonts";
import { fileToDataUrl, fileToImageDataUrl } from "../lib/media-files";
import { useCanvas } from "./CanvasProvider";
import { useTypeSettings } from "./TypeSettingsProvider";

const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const TRANSFORMS: TransformValue[] = ["none", "uppercase", "lowercase", "capitalize"];
const ALIGNS: AlignValue[] = ["left", "center", "right", "justify"];

const field =
  "mt-1 w-full rounded border border-[var(--color-border)] bg-transparent px-2 py-1 text-xs text-foreground";
const chip =
  "rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-foreground-muted)] transition-colors hover:border-foreground/40 hover:text-foreground";
const chipOn = "rounded-full border border-foreground/50 px-2 py-0.5 text-[11px] text-foreground";

/**
 * Controls for whichever block is selected: where it sits, how its type is
 * set, and — for pictures and video — what it shows.
 */
export function BlockInspector() {
  const {
    editing,
    selectedId,
    setSelectedId,
    placementFor,
    setPlacement,
    styleFor,
    setStyle,
    clearStyle,
    blockById,
    updateBlock,
    duplicateBlock,
    removeBlock,
    hideBlock,
  } = useCanvas();
  const { setValue } = useTypeSettings();
  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const [fontQuery, setFontQuery] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCustomFonts(readCustomFonts());
  }, []);

  if (!editing || !selectedId) return null;

  const id = selectedId;
  const isTextPick = id.includes("#");
  const parentBlockId = id.split("#")[0] as string;
  const style: BlockStyle = styleFor(id) ?? {};
  const placement = placementFor(id);
  const block = isTextPick ? undefined : blockById(id);

  function patch(next: BlockStyle) {
    setStyle(id, next);
  }

  function addFont() {
    const name = fontQuery.trim().replace(/\s+/g, " ");
    if (!name) return;
    loadGoogleFont(name);
    setCustomFonts((prev) => {
      const next = prev.includes(name) ? prev : [...prev, name];
      writeCustomFonts(next);
      return next;
    });
    patch({ family: fontStackFor(name) });
    setFontQuery("");
  }

  function applySharedStyle(role: RoleKey) {
    if (block?.kind === "text") updateBlock(id, { role });
    clearStyle(id);
  }

  /** Pushes this block's look onto a shared style used across the site. */
  function saveAsSharedStyle(role: RoleKey) {
    if (style.family) setValue(role, "family", style.family);
    if (style.weight) setValue(role, "weight", style.weight);
    if (style.leading) setValue(role, "leading", style.leading);
    if (style.tracking !== undefined) setValue(role, "tracking", style.tracking);
    if (style.wordSpacing !== undefined) setValue(role, "wordSpacing", style.wordSpacing);
    if (style.align) setValue(role, "align", style.align);
    if (style.transform) setValue(role, "transform", style.transform);
    if (style.italic !== undefined) setValue(role, "italic", style.italic);
    setNote(`Saved into ${ROLE_LABELS[role]}`);
    setTimeout(() => setNote(null), 2000);
  }

  async function onFile(file: File | undefined) {
    if (!file || !block) return;
    setNote("Loading…");
    try {
      if (file.type.startsWith("video/")) {
        if (file.size > 12 * 1024 * 1024) {
          setNote("That video is too large — paste a link instead");
          return;
        }
        updateBlock(id, { kind: "video", src: await fileToDataUrl(file) });
      } else {
        updateBlock(id, {
          kind: "image",
          src: await fileToImageDataUrl(file),
          alt: block.alt || file.name,
        });
      }
      setNote(null);
    } catch {
      setNote("Could not read that file");
    }
  }

  return (
    <aside
      data-editor-ui=""
      data-no-drag=""
      className="fixed bottom-4 right-4 z-[70] max-h-[80vh] w-80 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-background/98 p-4 shadow-xl backdrop-blur"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-[var(--color-foreground-subtle)]">
          {isTextPick
            ? "Selected type"
            : block
              ? block.kind === "text"
                ? "Text block"
                : block.kind === "shape"
                  ? "Colour block"
                  : block.kind === "video"
                    ? "Video block"
                    : "Image block"
              : "Block"}
        </span>
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="text-xs text-[var(--color-foreground-muted)] hover:text-foreground"
        >
          Close
        </button>
      </div>

      {isTextPick && (
        <button
          type="button"
          onClick={() => setSelectedId(parentBlockId)}
          className={`${chip} mb-3`}
        >
          ← Whole block instead
        </button>
      )}

      {/* Position — colour blocks always span the full width, so only
          vertical position and height apply to them. */}
      {!isTextPick && (
      <div className={`mb-4 grid gap-2 ${block?.kind === "shape" ? "grid-cols-2" : "grid-cols-4"}`}>
        {(
          block?.kind === "shape"
            ? ([["y", "Row", 0, 999], ["h", "Tall", 1, 999]] as const)
            : ([
                ["x", "Col", 0, 11],
                ["y", "Row", 0, 999],
                ["w", "Wide", 1, 12],
                ["h", "Tall", 1, 999],
              ] as const)
        ).map(([key, label, min, max]) => (
          <label key={key} className="block">
            <span className="text-[10px] uppercase tracking-wide text-[var(--color-foreground-subtle)]">
              {label}
            </span>
            <input
              type="number"
              min={min}
              max={max}
              value={placement[key]}
              onChange={(e) =>
                setPlacement(id, { ...placement, [key]: Number(e.target.value) })
              }
              className={field}
            />
          </label>
        ))}
      </div>
      )}

      {/* Media */}
      {!isTextPick && block && (block.kind === "image" || block.kind === "video") && (
        <div className="mb-4 space-y-2 border-t border-[var(--color-border)] pt-3">
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
          <button type="button" onClick={() => fileRef.current?.click()} className={chip}>
            Upload from computer
          </button>
          <input
            className={field}
            value={block.src.startsWith("data:") ? "" : block.src}
            placeholder={
              block.src.startsWith("data:")
                ? "Uploaded file"
                : "…or paste an image / video link"
            }
            onChange={(e) => {
              const v = e.target.value;
              const isVideo = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(v) || !!embedLike(v);
              updateBlock(id, { src: v, kind: isVideo ? "video" : block.kind });
            }}
          />
          <input
            className={field}
            value={block.alt}
            placeholder="Description for screen readers"
            onChange={(e) => updateBlock(id, { alt: e.target.value })}
          />
          <input
            className={field}
            value={block.caption}
            placeholder="Caption (optional)"
            onChange={(e) => updateBlock(id, { caption: e.target.value })}
          />
          <div className="flex flex-wrap gap-1">
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => updateBlock(id, { aspect: r })}
                className={block.aspect === r ? chipOn : chip}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Colour shape */}
      {block?.kind === "shape" && (
        <div className="mb-4 space-y-3 border-t border-[var(--color-border)] pt-3">
          <div className="text-[10px] uppercase tracking-wide text-[var(--color-foreground-subtle)]">
            Colour
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {SHAPE_FILLS.map((c) => (
              <button
                key={c.label}
                type="button"
                title={c.label}
                onClick={() => updateBlock(id, { fill: c.value })}
                className={`h-6 w-6 rounded-full border ${
                  block.fill === c.value
                    ? "border-foreground ring-2 ring-foreground/30"
                    : "border-[var(--color-border)]"
                }`}
                style={{ background: c.value }}
              />
            ))}
            <input
              type="color"
              aria-label="Custom colour"
              onChange={(e) => updateBlock(id, { fill: e.target.value })}
              className="h-6 w-8 cursor-pointer rounded border border-[var(--color-border)] bg-transparent"
            />
          </div>
          <Slider
            label="Strength"
            value={block.opacity ?? 0.06}
            active
            min={0.02}
            max={1}
            step={0.02}
            digits={2}
            suffix=""
            onChange={(v) => updateBlock(id, { opacity: v })}
            onClear={() => updateBlock(id, { opacity: 0.06 })}
          />
          <Slider
            label="Corners"
            value={block.radius ?? 0}
            active
            min={0}
            max={64}
            step={1}
            digits={0}
            suffix="px"
            onChange={(v) => updateBlock(id, { radius: v })}
            onClear={() => updateBlock(id, { radius: 0 })}
          />
        </div>
      )}

      {/* Typography */}
      {block?.kind !== "shape" && (
      <div className="space-y-3 border-t border-[var(--color-border)] pt-3">
        <div className="text-[10px] uppercase tracking-wide text-[var(--color-foreground-subtle)]">
          Type
        </div>

        <label className="block">
          <span className="text-xs text-[var(--color-foreground-muted)]">Typeface</span>
          <select
            value={style.family ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v) loadGoogleFont(familyFromStack(v));
              patch({ family: v || undefined });
            }}
            className={field}
          >
            <option value="">Follow shared style</option>
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

        <div className="flex gap-1">
          <input
            value={fontQuery}
            onChange={(e) => setFontQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFont();
              }
            }}
            placeholder="Add any Google font by name"
            className="min-w-0 flex-1 rounded border border-[var(--color-border)] bg-transparent px-2 py-1 text-xs text-foreground"
          />
          <button type="button" onClick={addFont} className={chip}>
            Add
          </button>
        </div>

        <label className="block">
          <span className="text-xs text-[var(--color-foreground-muted)]">Weight</span>
          <select
            value={style.weight ?? ""}
            onChange={(e) =>
              patch({ weight: e.target.value ? Number(e.target.value) : undefined })
            }
            className={field}
          >
            <option value="">Follow shared style</option>
            {WEIGHTS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>

        <Slider
          label="Size"
          value={style.size ?? 16}
          active={style.size !== undefined}
          min={8}
          max={160}
          step={1}
          digits={0}
          suffix="px"
          onChange={(v) => patch({ size: v })}
          onClear={() => patch({ size: undefined })}
        />
        <Slider
          label="Leading"
          value={style.leading ?? 1.4}
          active={style.leading !== undefined}
          min={0.8}
          max={2.4}
          step={0.01}
          digits={2}
          suffix=""
          onChange={(v) => patch({ leading: v })}
          onClear={() => patch({ leading: undefined })}
        />
        <Slider
          label="Tracking"
          value={style.tracking ?? 0}
          active={style.tracking !== undefined}
          min={-0.1}
          max={0.4}
          step={0.005}
          digits={3}
          suffix="em"
          onChange={(v) => patch({ tracking: v })}
          onClear={() => patch({ tracking: undefined })}
        />
        <Slider
          label="Word spacing"
          value={style.wordSpacing ?? 0}
          active={style.wordSpacing !== undefined}
          min={-0.1}
          max={1}
          step={0.01}
          digits={2}
          suffix="em"
          onChange={(v) => patch({ wordSpacing: v })}
          onClear={() => patch({ wordSpacing: undefined })}
        />

        <div>
          <span className="text-xs text-[var(--color-foreground-muted)]">Colour</span>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {BLOCK_COLORS.map((c) => (
              <button
                key={c.label}
                type="button"
                title={c.label}
                onClick={() => patch({ color: c.value || undefined })}
                className={`h-6 w-6 rounded-full border ${
                  (style.color ?? "") === c.value
                    ? "border-foreground ring-2 ring-foreground/30"
                    : "border-[var(--color-border)]"
                }`}
                style={{
                  background: c.value || "transparent",
                  backgroundImage: c.value
                    ? undefined
                    : "linear-gradient(45deg, transparent 45%, var(--color-border) 45%, var(--color-border) 55%, transparent 55%)",
                }}
              />
            ))}
            <input
              type="color"
              aria-label="Custom colour"
              onChange={(e) => patch({ color: e.target.value })}
              className="h-6 w-8 cursor-pointer rounded border border-[var(--color-border)] bg-transparent"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {ALIGNS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => patch({ align: style.align === a ? undefined : a })}
              className={style.align === a ? chipOn : chip}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          {TRANSFORMS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => patch({ transform: style.transform === t ? undefined : t })}
              className={style.transform === t ? chipOn : chip}
            >
              {t === "none" ? "As written" : t}
            </button>
          ))}
          <button
            type="button"
            onClick={() => patch({ italic: style.italic ? undefined : true })}
            className={style.italic ? chipOn : chip}
          >
            Italic
          </button>
        </div>
      </div>
      )}

      {/* Shared styles */}
      {block?.kind !== "shape" && (
      <div className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-3">
        <div className="text-[10px] uppercase tracking-wide text-[var(--color-foreground-subtle)]">
          Shared styles
        </div>
        <div className="flex flex-wrap gap-1">
          {[...BLOCK_STYLE_ROLES, "display" as const].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => applySharedStyle(r)}
              className={block?.role === r ? chipOn : chip}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="text-xs text-[var(--color-foreground-muted)]">
            Save this look into a shared style
          </span>
          <select
            value=""
            onChange={(e) => {
              const r = e.target.value as RoleKey;
              if (r) saveAsSharedStyle(r);
            }}
            className={field}
          >
            <option value="">Choose…</option>
            {[...BLOCK_STYLE_ROLES, "display" as const].map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
      </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3">
        {block && block.kind !== "shape" && (
          <>
            <button type="button" onClick={() => duplicateBlock(id, "above")} className={chip}>
              Duplicate above
            </button>
            <button type="button" onClick={() => duplicateBlock(id, "below")} className={chip}>
              Duplicate below
            </button>
          </>
        )}
        {block?.kind !== "shape" && (
          <button type="button" onClick={() => clearStyle(id)} className={chip}>
            Clear type overrides
          </button>
        )}
        {!isTextPick && (
          <button
            type="button"
            onClick={() => (block ? removeBlock(id) : hideBlock(id))}
            className={chip}
          >
            Remove block
          </button>
        )}
      </div>
      {note && (
        <div className="mt-2 text-[11px] text-[var(--color-foreground-subtle)]">{note}</div>
      )}
    </aside>
  );
}

function embedLike(src: string) {
  return /youtu\.be|youtube\.com|vimeo\.com/.test(src);
}

function Slider({
  label,
  value,
  active,
  min,
  max,
  step,
  digits,
  suffix,
  onChange,
  onClear,
}: {
  label: string;
  value: number;
  active: boolean;
  min: number;
  max: number;
  step: number;
  digits: number;
  suffix: string;
  onChange: (v: number) => void;
  onClear: () => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-xs text-[var(--color-foreground-muted)]">
        <span>{label}</span>
        <span className="flex items-center gap-2">
          <span className="tabular-nums">
            {active ? `${value.toFixed(digits)}${suffix}` : "auto"}
          </span>
          {active && (
            <button
              type="button"
              onClick={onClear}
              className="text-[10px] uppercase tracking-wide hover:text-foreground"
            >
              reset
            </button>
          )}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-foreground"
      />
    </label>
  );
}
