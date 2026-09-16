# Fix the repeated “out of date” warning

## What’s wrong
The editor batches changes for 400 ms, but it does not prevent two saves for the same content from running at once. When editing quickly or when a save responds slowly, the first save updates the timestamp while the next save still carries the previous timestamp. The editor then mistakes its own second save for a change from another tab and rejects it.

This means the warning is overly aggressive, and the rejected latest change may remain visible locally without reaching the shared saved site.

## Plan
1. Serialize saves separately for each content area so only one save for that area can be active at a time.
2. Keep the newest pending value while a save is active, then save it immediately after the current request succeeds using the returned timestamp.
3. Show the “out of date” warning only when the server confirms a genuine conflict after all earlier saves from this tab have completed.
4. Preserve the existing protection against an actually stale second tab overwriting newer work.
5. Verify rapid typing, dragging, and repeated style changes save without warnings, while a truly stale second tab is still blocked.
