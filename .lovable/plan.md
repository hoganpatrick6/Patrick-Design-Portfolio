# Fix: "Clyra" text edit not showing

## Why the change didn't appear
The default text was updated in `src/config/canvas-defaults.ts`, but the Work page reads blocks from two places: the code defaults AND previously saved editor content (stored site-wide in the backend, plus a copy in your browser). When both exist, the saved copy wins — and it still contains the old "Clyra" text for block `work-project-clyra-copy`.

## What to do

1. **Update the saved block content** in `src/components/CanvasProvider.tsx`: when canvas blocks load, if block `work-project-clyra-copy` still has the old title/description ("Clyra" / "UI system and marketing site for a B2B SaaS product."), replace them with "Uber Color System" / "A strategic consolidation to Uber's global color theory." and persist the corrected blocks so every visitor sees the update (this also repairs your browser's cached copy on next load).

2. **Keep the rest of the project data consistent** in `src/data/projects.ts`: update the Clyra project's title, client and description to match, so the project page itself and any other references agree.

3. **Verify** with a browser check on `/work`: the block shows "Uber Color System" and the new description, no console errors, and the text survives a page reload.

## Technical details
- Root cause confirmed: `CanvasProvider` hydration merges saved blocks over defaults by id (lines 110–131), and `src/data/projects.ts` still holds the old strings (lines 51, 54, 57).
- The patch targets only the matching block id and only when the old text is present, so any edits you make afterward are never overwritten.
