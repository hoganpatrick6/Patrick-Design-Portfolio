# Why content moves on its own — and how to make it stay put

## What's actually happening

Your pages don't store a block's position as a fixed spot. They store a starting row, and then the page recalculates every block's real position at load time, based on how tall the blocks above it turn out to be. Anything that changes a measured height changes where everything below it lands.

Four confirmed causes, all verified in the code:

1. **Positions are recomputed, not remembered.** Each block's final vertical spot is calculated on every load: start at its saved row, then slide down until it clears whatever sits above it (`src/components/Canvas.tsx:290-315`). Height comes from live measurement (`src/components/Canvas.tsx:207-209, 236-271`). So a paragraph that wraps to one extra line — because a font finished loading, an image loaded at a different size, or the window is a different width — pushes everything below it down. Nothing was moved; it was re-derived.

2. **Fonts and images arrive after the first paint.** The page measures immediately, then measures again when the custom font and images finish loading. That second measurement is why content visibly jumps a moment after a page appears.

3. **Project header fields are shared across all six projects.** Every project page's title/client/role/summary position is copied from one master placement on load (`synchronizedHeaderPlacements`, `src/components/CanvasProvider.tsx:158-173`, applied at `:515` and `:603`). Nudging a header on one project quietly relocates the same field on the other five.

4. **Returning to a tab replaces the layout in place.** Focusing the window refetches the saved site content and overwrites the positions currently on screen (`src/components/CanvasProvider.tsx:676-682`). If a recent nudge hadn't finished saving, it's visually reverted.

## The fix

**A. Lock in measured heights so re-measuring can't reshuffle the page**
- Remember each block's settled height and reuse it for the first paint, so the page doesn't lay out once at a guess and then again for real.
- Wait for the custom font and for in-frame images to report their size before the first layout pass, so the "second jump" disappears.
- Ignore sub-row height wobble: only treat a block as taller when it grows past a full row, so a one-pixel wrapping difference can't cascade.

**B. Respect the saved position of fixed-height blocks**
- For image, video, shape and rule blocks, use the height you set — stop letting a measured overflow silently inflate the block and push its neighbours.

**C. Stop the header template from relocating other projects on load**
- Apply the shared header position only when you actually change a header field in the editor, not on every page load. Existing header positions stay exactly as they are today.

**D. Make the focus refetch non-destructive**
- On refocus, keep any edit made in this tab that hasn't finished saving, and only take in changes from elsewhere. No more silent revert of a fresh nudge.

## Technical notes

- `Canvas.tsx`: persist `heights` per block id via the existing site-content store keyed alongside placements; seed `heights` state from it on mount so `resolved` is stable on first render. Gate the initial measure on `document.fonts.ready` and image `decode()`/`load`. Apply hysteresis in the `contentRows` calculation (round to whole `ROW_UNIT` rows; for `autoHeight` keep `TEXT_ROW_STEP` granularity but require a full step of change before updating).
- `Canvas.tsx:245, 263`: for non-`autoHeight` items use `item.p.h` rather than `Math.max(item.p.h, contentRows)`.
- `CanvasProvider.tsx`: move `synchronizedHeaderPlacements` / `synchronizedHeaderStyles` out of `applyShared` and the hydration effect; keep the existing peer propagation in `setPlacement`/`setStyle` (`:693-706`) which already covers intentional edits.
- `CanvasProvider.tsx:676-682`: have `applyShared` merge rather than replace for keys with in-flight writes — reuse the pending map in `src/lib/site-content.ts`.

## Not in scope

No wording, copy, images or existing saved positions change. This only stops positions from being recalculated differently between visits.
