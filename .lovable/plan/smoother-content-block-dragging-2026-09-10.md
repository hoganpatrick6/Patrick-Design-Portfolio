# Smoother content block dragging

## Changes
- Make the active block follow the pointer continuously while it remains snapped to the 12-column grid.
- Animate neighboring blocks into their new positions as soon as the dragged block crosses them.
- Prevent end-of-drag snapping and reduce jitter by batching pointer updates to the browser's animation frame.
- Preserve the existing editor controls, grid positions, resizing, deletion, and site-wide saving behavior.

## Validation
- Drag blocks horizontally and above/below neighboring blocks on a project page.
- Confirm neighboring blocks transition smoothly, the active block settles cleanly, and saved positions remain intact.
- Check the page at desktop and mobile widths and confirm the project still builds without errors.
