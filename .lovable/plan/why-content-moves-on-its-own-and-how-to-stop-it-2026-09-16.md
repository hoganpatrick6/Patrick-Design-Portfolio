# Why content moves on its own — and how to stop it

## What's actually happening

Nothing is being secretly re-saved. Your saved positions never change by themselves — I traced every place a position can be written, and all of them are you: dragging, the number fields in the inspector, duplicating, or undo.

The problem is that the page does not lay itself out from your saved positions alone. Every time a page loads, it re-measures the real height of every text and image block, then slides blocks down so they don't overlap. That measurement can come out slightly different from one visit to the next — fonts finish loading at a different moment, an image arrives a beat later, the window is a slightly different width, the scrollbar appears or doesn't. When one block measures a little taller or shorter, everything positioned below it moves, and it looks like your layout shifted while you were away.

Two smaller contributors:

- Blocks are only measured once they appear. An image or video that loads late joins the layout late, and everything re-settles at that moment — that's the jump you see a second or two after a page opens.
- The four header fields (title, client, role, summary) are force-synced to the shared template on every page load and every time the tab regains focus, so an individually nudged header on one project snaps back.

## The fix

1. **Freeze positions once measured.** After a page's blocks have loaded and measured, lock the computed positions for that visit instead of letting late measurements keep re-flowing everything. New measurement only re-runs when you actually edit or the window width changes category (desktop/mobile).

2. **Measure after fonts and media are ready.** Hold the first layout pass until web fonts are loaded and images/videos report their size, so the first result is the final result rather than a guess that corrects itself.

3. **Round heights to the grid consistently.** Snap measured heights to the baseline grid before they feed the push-down, so a one- or two-pixel measurement difference can no longer change where a block lands.

4. **Reserve space for media.** Use each media block's saved height as its placeholder height while it loads, so late-arriving images don't push neighbours around.

5. **Stop the header snap-back on focus.** Keep the shared header template applied when the template version actually changes, but don't re-force it on every tab focus.

## Technical notes

- `src/components/Canvas.tsx` — the `resolved` `useMemo` (~L215-318) recomputes `top`/`rows` from `heights` + `autoHeightIds` on every measurement change; `reportHeight` (L207) fires from a `ResizeObserver` per block (L485-494). Quantize `h` to `TEXT_ROW_STEP` before deriving `contentRows`, and gate the first resolve behind a "ready" flag (fonts ready + all registered ids have reported a height, or a short timeout).
- Non-autoHeight blocks currently take `Math.max(item.p.h, contentRows)` (L245, L263), so a media block that measures taller than its saved height silently grows and pushes everything below. Clamp media blocks to their saved `h` and let overflow be contained rather than reflow the page.
- `src/components/CanvasProvider.tsx` — the focus handler (L676-682) calls `refreshSiteContent().then(applyShared)`, and `applyShared` always runs `synchronizedHeaderPlacements`/`synchronizedHeaderStyles` (L515-524). Apply that sync only on version reset/hydration, not on every focus.
- No change to saved data or copy; this is layout-resolution behaviour only.

## Verification

Load each project page three times in a row and compare block positions, with and without a cold cache; confirm no visible settle after load and that a header nudged on one project stays put across a tab switch.
