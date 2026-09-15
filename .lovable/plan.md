# Use Uber Credit Card as the project-header reference

## Goal
Make the current **Uber Credit Card** top section the canonical layout and typography reference for every project page, while keeping each project’s wording independently editable.

## Changes
- Capture the saved title, client, role, and summary placement from Uber Credit Card as the shared header template.
- Capture Uber Credit Card’s current type settings for those four fields and apply each setting to the equivalent field on every project page.
- Keep all project-specific text unchanged; only placement and typography will synchronize.
- Leave every section below the project header untouched.
- Preserve the existing behavior where future placement or type changes to one project-header field update that same field across all projects.
- Add a one-time template update so older saved header overrides are replaced by this new Uber Credit Card reference without restoring deleted unrelated content.

## Validation
- Compare all six project pages at desktop and mobile sizes.
- Confirm title, client, role, and summary begin on the same grid positions and use matching typography.
- Confirm longer text wraps cleanly without overlap and all wording remains project-specific.

## Technical details
- Change the canonical header source from the first project’s code defaults to the current saved Uber Credit Card header values.
- Advance the shared header-template version so the synchronized migration runs once for existing visitors and saved editor state.
- Keep synchronization scoped to the four established project-header slots.
