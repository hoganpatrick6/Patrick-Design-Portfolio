# Restore the About page (and the portrait)

## What happened

Nothing was deleted from your saved content. Two separate things are going on:

1. On the About page, four sections — Experience, Skills, Education and Recommendations — are marked as hidden in the saved version. All of their wording (Kent State, the Houzz/Uber/Carbon Health bullets, your skills lists, both recommendations) is still stored intact.
2. Your portrait was uploaded three times last night, but the saved page never ended up with an image slot pointing at it. The photo itself is safe in your media library — I found it and confirmed it is the right one (you in a brown shirt against a light background).

## What I'll do

1. Bring back the four hidden About sections, with their saved wording untouched.
2. Add a portrait image slot on the left column of the About page, directly under the intro copy, using the photo from your library.
3. Add the same portrait in the same position on the Resume page.
4. Leave every other page, all wording, and all other images exactly as they are. No new copy of any kind will be written.

## One thing to confirm as we go

The About page also has two empty text boxes ("New text block") sitting on it from an earlier session. I'll leave them in place unless you tell me to remove them.

## Technical notes

- Remove `about-experience`, `about-skills`, `about-education`, `about-recommendations` from the saved `canvas.hidden` list in `site_content`.
- Add an image block on page `about` and page `resume` pointing at `/api/public/media/974cf46a-f778-4319-9ff0-ee4e01216369` (image/jpeg, 1200x1800), placed in the left column beneath the intro block (`x:0`, below `about-intro` / `resume-intro`, above the contact block's row, with contact shifted down as needed).
- Persist through the saved `canvas.blocks` / `canvas.placements` records so the change survives reload in both tabs; verify with Playwright at desktop and mobile widths.
