# Make text boxes fit their content

## Goal
Every text-only box should end at the bottom of its visible type instead of keeping unused grid height. Changing the box width, wording, font, size, or leading should immediately rewrap the copy and update its height.

## Changes
- Mark text-only canvas blocks as content-fitting, including added text boxes, Work project descriptions, project titles, metadata, summaries, and editorial paragraphs.
- Size those frames from their rendered text rather than their saved minimum row height, while retaining their saved grid position and column width.
- Use the measured text height for collision and page-flow calculations so nearby content moves smoothly when text wraps onto more or fewer lines.
- Keep horizontal resizing for text boxes; remove the misleading vertical-only resize behavior because height will be automatic.
- Leave image, video, line, and color blocks on their existing sizing behavior.

## Technical details
- Extend the canvas layout registration with an `autoHeight` flag per block.
- For auto-height blocks, calculate occupied rows from measured content plus the standard inter-block gap, without taking the old `placement.h` minimum.
- Render auto-height frames without a grid-based `min-height`; their outline and controls will hug the content exactly.
- Identify auto-height blocks explicitly at their render sites rather than guessing from DOM content.

## Verification
- Check added text boxes and built-in text blocks on Work, About, and project pages.
- Resize text widths and change copy/type settings; confirm wrapping updates the frame and pushes overlapping content down.
- Verify image/video/color/line sizing is unchanged at desktop and mobile widths.
