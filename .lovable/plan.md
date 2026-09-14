# Editable project header bands

## Build
- Give every project page a full-width colored header band matching the supplied editorial reference.
- Arrange the project title at the top, with client and role details below on the left and the project description on the right.
- Keep the remaining case-study content below the band and preserve the Grocery Fresh image sequence.
- Add one independent background-color object per project so each header color can be selected and changed with the existing color controls.

## Technical details
- Add semantic light/dark header color tokens and use them as the default fill.
- Add project-specific background blocks to the shared canvas data, ensuring saved layouts receive the new blocks without overwriting later custom edits.
- Update default header placements and narrowly migrate only unchanged legacy placements into the new arrangement.
- Verify the result on desktop and mobile, including editing and color selection.
