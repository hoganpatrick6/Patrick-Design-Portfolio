# Add vertical row snapping

## Changes
- Extend each block’s saved grid position with a vertical row value alongside its existing column placement and order.
- Show evenly spaced horizontal row guides together with the 12 column guides while Layout mode is active.
- Snap a dragged block to the nearest row while preserving smooth pointer tracking and animated reflow of surrounding blocks.
- Keep rows content-aware so taller text, image, and video blocks occupy the space they need without overlapping.
- Include row positions in site-wide saves and layout reset behavior.

## Validation
- Drag text, image, and video blocks vertically and confirm they land on visible row lines.
- Confirm surrounding blocks reflow smoothly without overlaps.
- Verify saved row positions survive a refresh and the page remains clean outside Layout mode.
