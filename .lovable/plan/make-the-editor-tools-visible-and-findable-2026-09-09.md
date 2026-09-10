# Make the editor tools visible and findable

## Problem
The type, layout, and media tools are in the top nav as small, icon-only circles (a sun, a "T", a grid, a picture). They have no text labels, so they're easy to miss — and you've reported not seeing them at all. The privacy gate itself is working (it returns "editor: true" in the Lovable preview), so the buttons are present; they're just not recognizable.

## Goal
Make the type tool — and the other private editor controls — clearly visible and labeled while you're editing in Lovable, without exposing them to public visitors on the published site.

## Changes
1. **Label the editor buttons.** Replace the icon-only circles with small labeled chips: "Type", "Layout", "Media". Keep the sun/moon theme toggle as an icon (it's already familiar). The active/open state gets a subtle highlight.
2. **Single obvious entry for type.** The "Type" chip opens the existing full type panel (typeface, weight, size, leading, tracking, word spacing, line length, block spacing, case, alignment, italic, copy/reset/save) — no change to what it controls, only how you open it.
3. **Keep the privacy gate as-is.** The gate already unlocks automatically in the Lovable preview and via `?edit=YOUR-KEY` on the published domain. No change needed there; the fix is purely visual discoverability.
4. **Apply on every page** that has the nav: About, Work, and individual project pages.
5. **Verify in the browser** that the labeled "Type" chip appears in the nav on /about and /work and opens the panel.

## Files
- `src/components/TypeSettingsPanel.tsx` — labeled "Type" chip instead of icon circle
- `src/components/LayoutEditorToggle.tsx` — labeled "Layout" chip
- `src/components/MediaEditorToggle.tsx` — labeled "Media" chip
- (No route or server-function changes needed.)

## Out of scope
- Changing what the type panel controls.
- Changing the privacy gate logic or the `EDITOR_KEY`.
- Anything visitor-facing on the published site.
