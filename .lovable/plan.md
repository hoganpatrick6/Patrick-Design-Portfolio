# Synchronize every project header

## Goal
Make the copy at the top of every project page follow one consistent layout and type system, while keeping each project’s wording directly editable.

## What will change
- Treat the title, client, role, and summary as four shared header slots across every project, including Grocery Fresh.
- Align all existing project headers to one 12-column template: title across the top, client and role together on the left, and summary on the right.
- Use the same shared type roles everywhere: display for titles, label for “Client” and “Role,” and body for their values and the summary.
- Remove the saved one-off placement and type overrides currently making Grocery Fresh and Uber Credit Card differ from the other projects.
- Keep content independent: changing the words on one project will not change another project’s words.

## Synchronized editing
- Moving or resizing any header slot on one project will apply the same placement to that slot on every project.
- Changing a header slot’s font, size, leading, colour, alignment, or other type controls will apply to the same slot on every project.
- Direct text editing remains project-specific.
- Content below each header remains independently movable and styleable.

## Technical details
- Add a shared header-slot mapping for both the standard `project-{slug}-*` IDs and the existing `grocery-*` IDs.
- Store one canonical placement and style per header slot, then resolve every project header through those shared values.
- Migrate existing saved header data once, preserving all wording while replacing conflicting placements and styles with the canonical template.
- Keep automatic text-height measurement so longer summaries wrap without overlap while retaining the same starting grid position.

## Verification
- Compare all six project pages at desktop and mobile widths.
- Change each header slot’s placement and type styling on one project, then confirm the same change appears on every other project.
- Edit project wording and confirm it changes only on that project.
- Confirm header copy does not overlap and content below still flows correctly.
