# Restore the private controls in the Lovable preview

## Problem
The Type / Layout / Media chips are hidden because the privacy gate only unlocks when (a) the app runs in development mode, or (b) the editor session was unlocked with `?edit=YOUR-KEY`. The Lovable preview runs as a production build, so the gate stays locked unless the key URL is used — and the unlocked session is a cookie that disappears when cookies clear or the preview URL changes. Confirmed locally: buttons appear in dev (`Type`, `Layout`, `Media` present in the header), but the preview domain follows the locked path.

## Goal
You always see your private controls when using the Lovable preview, with no key or special URL — while public visitors to the published site still never see them.

## Changes
1. **Auto-unlock on the preview domain.** In the editor gate (`checkEditorAccess`), treat the request as unlocked when it comes from the Lovable preview host (`id-preview--*.lovable.app` / `*-dev.lovable.app`). The published site and custom domains stay locked without the `?edit=` key.
2. **Same check everywhere.** The new shared-save function (`saveSiteContentValue`) uses the same unlock rule so edits made in the preview save to the site.
3. **Verify in the browser** that the chips appear on /about and /work in the preview and that panels open.

## Files
- `src/lib/type-settings.functions.ts` — preview-host unlock in `checkEditorAccess`
- `src/lib/site-content.functions.ts` — same unlock rule for saving edits

## Out of scope
- Changing what the panels do, or the `?edit=` key flow on the published site.
