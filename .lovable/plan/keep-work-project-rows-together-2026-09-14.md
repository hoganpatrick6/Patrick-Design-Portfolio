# Keep Work project rows together

## Changes
- Treat each Work thumbnail and its matching description as one responsive layout row while keeping both independently selectable and editable.
- Make both halves share the same vertical position and reserve the height of the taller half, so later projects remain aligned when text wraps during resizing.
- Preserve the existing single-column order on small screens and the current duplicate/delete controls.

## Validation
- Resize the Work page across desktop, tablet, and mobile widths and confirm every thumbnail stays paired with its copy.
- Confirm project blocks remain independently editable and the page has no layout or console errors.
