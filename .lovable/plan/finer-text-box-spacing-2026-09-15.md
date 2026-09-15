# Finer text-box spacing

## What will change
- Let text boxes move on a finer vertical sub-grid, so they can be positioned closer before their order changes.
- Remove the extra invisible full-row gap currently reserved beneath auto-sizing text boxes.
- Keep the existing 12-column layout, text wrapping, and automatic collision protection.

## Technical details
- Use quarter-row vertical drag increments (6px within the existing 24px baseline grid).
- Calculate auto-height collision space from the rendered text height itself rather than rendered height plus the 24px column gutter.
- Verify two nearby text boxes remain separate, can be tightly spaced, and still avoid overlap.
