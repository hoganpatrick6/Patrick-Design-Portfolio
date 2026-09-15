# Rename project URLs to match current project titles

## Goal
Each project's web address matches its current title instead of the old placeholder name.

## New URLs
| Current URL | New URL |
|---|---|
| /work/lunethra | /work/uber-credit-card |
| /work/driftwell | /work/grocery-fresh |
| /work/clyra | /work/uber-color-system |
| /work/forgekind | /work/carbon-health-rebrand |
| /work/nestive | /work/nestive (unchanged) |
| /work/pollenate | /work/pollenate (unchanged) |

Titles come from the saved site content (e.g. Forgekind's page is now "Carbon Health Rebrand"), not the old defaults.

## What changes
1. **Project data** — update each project's slug in `src/data/projects.ts`.
2. **Editor block ids** — the old slug is baked into editor block ids (`project-lunethra-title`, `work-project-clyra-copy`, `work-rule-driftwell`, the `grocery-*` set, page keys like `project:lunethra`). Rename these in `src/config/canvas-defaults.ts` and `src/routes/work.$slug.tsx` so everything stays consistent. The `grocery-*` ids become `grocery-fresh-*` to match the new slug.
3. **Work page links** — update each project card's `href` in the defaults so the thumbnails/copy point at the new URLs.
4. **Saved edits migration (one-time)** — your saved layout, styles, hidden/deleted lists, inline text edits, and duplicated blocks all reference the old ids. On first load after the change, rename every old id and page key to its new equivalent inside the saved content (blocks, placements, styles, texts, hidden, removed) so nothing is lost and no old placeholder resurfaces. Old ids are dropped rather than merged, so nothing duplicates.
5. **Old links keep working** — add a redirect from each old `/work/<old-slug>` address to the new one, so bookmarks or shared links don't break.
6. **Next-project footer** — automatically follows the new slugs; no change needed beyond the data update.

## Verification
- Visit every project at its new URL and confirm content, images, and saved edits appear unchanged.
- Confirm each old URL redirects to the new one.
- Confirm the Work page cards link to the new URLs, and check at desktop and mobile widths.

## Technical details
- Slug rename map: `lunethra→uber-credit-card`, `driftwell→grocery-fresh`, `clyra→uber-color-system`, `forgekind→carbon-health-rebrand`.
- Migration runs in the canvas provider's existing hydration/repair path (`repairSavedBlocks`), alongside the current migrations; id renames are pure string mapping.
- Redirects are handled in the `/work/$slug` loader: unknown slug that matches an old one issues a `redirect()` to the new URL.
- `PROJECT_SLUGS`, `projectHeaderIds`, and header peer-sync all pick up the new ids automatically since they derive from the same constants.
