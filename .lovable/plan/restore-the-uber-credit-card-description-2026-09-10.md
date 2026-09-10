# Restore the Uber Credit Card description

## Change
- Restore “Design and art direction for Uber’s first multi-market co-brand credit card” as the Uber Credit Card project description.
- Keep the existing project title, year, overview copy, layout, and editor settings unchanged.

## Result
- The copy will reappear directly beneath “Uber Credit Card” on the Work page.
- Because both views use the same project data, it will also reappear beneath the title on the dedicated project page.

## Technical detail
- Update the empty `description` value for the `lunethra` project in the shared project data source.
- Verify both `/work` and `/work/lunethra` render the restored copy.
