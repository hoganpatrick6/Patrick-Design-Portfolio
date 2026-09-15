# Fix: old content keeps coming back / latest edits not sticking

## Why this is happening (confirmed)
- Uploaded images are stored as giant embedded data strings inside the saved page layout (`canvas-blocks`), which is now ~4.6 MB. Your browser's local storage total is ~8.75 MB — past its ~5 MB limit — so new saves silently fail (failures are swallowed by a catch). On reload, the older saved copy wins and old content returns.
- Two preview tabs are currently open. Both load the saved site content at open time and write back later, so a stale tab can overwrite newer edits from the other tab.
- Separately, deleted built-in blocks (like a project headline) are not remembered as deleted: on reload the defaults are merged back in, so removed default content resurrects.

## What to change

1. **Stop embedding images in the layout data.** When an image is added or replaced, store the file once in the media library and keep only a short reference (its media id) in the block. Layout saves drop from megabytes to kilobytes, so they stop failing.
2. **One-time cleanup of existing saves.** On load, find any block still carrying an embedded data-string image (in both the browser copy and the shared site content), move it into the media library, and rewrite the block to reference it. This shrinks the existing 4.6 MB save automatically — no manual steps.
3. **Remember deletions of built-in blocks.** Keep a small "deleted defaults" list; when merging defaults with saved content, skip any default the user deleted, so removed content stays gone. Reset still restores everything.
4. **Make save problems visible.** If a local save fails (storage full or otherwise), show a brief toast instead of failing silently, so you're never guessing whether an edit stuck.
5. **Guard against stale tabs.** When a preview tab regains focus, reload the shared site content before the next save, and keep the newest copy rather than blindly overwriting — so two open tabs can't revert each other.

## Recovery of what was just lost
- The content that reverted can be brought back immediately via **History** (roll back to just before it changed) — the plan includes verifying this works for you.

## Technical details
- `src/lib/media-files.ts` — add "store file, return reference" helper used by all image add/replace/drop paths (PNG transparency handling stays as-is).
- `src/components/CanvasProvider.tsx` — hydration migration for embedded images (local + remote), deleted-defaults tombstone list in merge, focus-refetch before save, toast on `store()` failure.
- `src/lib/site-content.ts` — expose a cache-refresh so a refocused tab reloads shared content instead of reusing the stale in-memory copy.
- Verify with a browser check: make edits, reload, confirm they stick; delete a built-in block, reload, confirm it stays deleted; confirm storage size drops well under the limit.
