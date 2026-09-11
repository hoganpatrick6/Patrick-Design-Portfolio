# Replace Grocery Fresh imagery with placeholders

## Scope
- Change every image shown on the Grocery Fresh project page into a plain neutral-gray placeholder.
- Preserve each image block’s current dimensions, spacing, and responsive layout.
- Keep the editor’s replace controls available so real images can still be dropped into each placeholder later.

## Technical details
- Add a placeholder mode to the existing editable media element, rendering a semantic gray surface until an image override exists.
- Enable that mode for all six Grocery Fresh image positions only; other project pages remain unchanged.
- Verify the public page and edit mode at desktop and mobile sizes, then confirm diagnostics remain clean.
