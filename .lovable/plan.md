# Reformat every project header

## Goal
Match the supplied editorial header structure on every project page: a full-bleed colour field behind independently editable title, metadata, and summary blocks.

## Changes
- Add one editable background-colour block to each project page, spanning edge to edge and sitting behind the header content.
- Recompose the standard project header into separate movable blocks for the project title, client, role, and summary, using the reference layout on desktop.
- Bring the Grocery Fresh header into the same full-bleed system while preserving its existing independent content blocks.
- Keep the sticky navigation unchanged and preserve all project content below the header.
- Stack the header content cleanly on smaller screens without overlaps.

## Editor behavior
- The colour field remains selectable, movable vertically, resizable, recolourable, duplicable, and deletable through the existing editor.
- Each text area remains independently selectable and movable, with the existing font, size, leading, alignment, and colour controls.
- Existing saved layouts continue to load; the new header blocks are merged in as defaults.

## Verification
- Check every project route at desktop and mobile widths.
- Confirm the colour block reaches both page edges, remains behind the text, and all header elements can be selected independently in edit mode.
- Confirm diagnostics remain clean.
