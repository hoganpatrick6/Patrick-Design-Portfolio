# Even Resume section spacing

## What will change
- Keep the right-side Resume sections in their current order: Experience, Skills, Education, Recommendations.
- Flow each section directly from the measured bottom of the previous section with one consistent 48px gap.
- Preserve each section’s current width, horizontal position, typography, copy, and internal spacing.
- Let the column update immediately when text rewraps or type settings change, without accumulating oversized or zero-width gaps.

## Why this happens
The sections currently combine separate saved starting positions with automatic content heights. When copy grows, collision handling pushes later sections down without adding a gap; when copy shrinks, their old saved positions remain and leave excess space. The saved Resume positions also begin with Experience shifted down while the later sections retain older row positions, making the inconsistency more pronounced.

## Technical details
- Treat these four Resume blocks as one vertical flow group on desktop.
- Use each block’s measured content height plus two 24px baseline rows before placing the next block.
- Keep the existing single-column mobile layout unchanged.
- Verify the spacing after text edits, width changes, and type-size or leading changes.
