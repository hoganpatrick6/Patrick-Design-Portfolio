# Restore the missing intro paragraphs

## What happened

The Overview block on the project pages is still there, but its two paragraphs were saved as empty text. In the saved site content, the stored copy for the Overview block is two blank entries — so the block renders with nothing inside it. This most likely happened while typing directly into the text in edit mode (a select-all + delete, or an empty save).

One important detail: the Overview block uses the same identity on every project page, so the blank text applies to all projects, not just Carbon Health Rebrand.

## Fix

1. Clear the two blank saved entries for the Overview block so the page falls back to each project's written overview copy again.
2. Confirm the Overview paragraphs reappear on Carbon Health Rebrand and the other project pages.

## Prevent it happening again

3. Ignore an empty result when text is edited in place: if a text field is cleared to nothing, don't save a blank over the original wording — keep the previous text. Deleting content stays possible by deleting the block itself.
4. Give the Overview block its own identity per project, so editing the overview on one project no longer changes it on every other project. Existing saved overview edits carry over to the project they were made on.

## Technical notes

- Saved content key `canvas.texts` holds `"project-overview#0.0": ""` and `"project-overview#0.1": ""`; removing both keys restores the fallback from `project.overview` in `src/data/projects.ts`.
- Empty-text guard goes in `setText` in `src/components/CanvasProvider.tsx` (skip persisting when the trimmed value is empty).
- Per-project id: change `project-overview` in `src/routes/work.$slug.tsx` to `project-${project.slug}-overview`, add matching placements in `src/config/canvas-defaults.ts`, and add a one-time migration in `CanvasProvider` mapping old `project-overview` placements, styles and texts onto the new ids.
