# Separate Grocery Fresh page assets

## Scope
- Break the grouped Grocery Fresh introduction and four-image gallery into independently selectable canvas blocks.
- Keep the same visible composition, gray image placeholders, replace controls, and campaign strip.
- Give the title, client details, role details, summary, story heading, story paragraphs, and each image their own draggable and resizable block.

## Technical details
- Replace the grouped canvas wrappers with stable block IDs for each independent item.
- Add default 12-column and 24px baseline placements that recreate the current desktop layout and stack cleanly on smaller screens.
- Verify selection and movement in edit mode, plus desktop and mobile rendering.
