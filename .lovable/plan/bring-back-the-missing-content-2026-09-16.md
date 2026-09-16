# Bring back the missing content

Three separate things. One is a rename, one needs you to pick an image, and one needs recovery work.

## 1. Rename Nestive to Uber Photography Guidelines

You already renamed the title on the project page itself, but the Work list card and the page address still say Nestive.

- Work list card title becomes "Uber Photography Guidelines"
- Project page keeps the title you already typed
- Address becomes /work/uber-photography-guidelines, with the old /work/nestive address redirecting so nothing breaks
- All of that project's saved images, text and layout carry over

The card's short description underneath still reads "Magazine design and digital editorial direction." I will not invent replacement wording — tell me what it should say and I will set it, or leave it as is for now.

## 2. Uber Color System thumbnail

The image currently saved on that card is an animated GIF you uploaded. Since it should be a different one, I will show you a contact sheet of the images in your media library (there are 115), numbered, so you can point at the right one. Then I set it on the card.

## 3. The About page paragraphs

Your long About intro paragraph is saved and showing today, so first I need to pin down exactly which paragraph is gone. Steps:

1. Compare every saved About text entry against what the page renders, and list anything saved but hidden, deleted, or blank — hidden or deleted items can be brought straight back.
2. Check the saved Resume page copy, since Resume was made as a copy of About and may still hold an older version of the paragraph.
3. Report what I find with the wording, so you can confirm it is the text you remember.

Honest limit: the site keeps only the current saved copy of your text, not a history of it. If a paragraph was typed over or cleared and is not preserved in the Resume copy or as a hidden block, it cannot be recovered and you would need to retype it. I will tell you which case it is before doing anything else.

## Also worth fixing while I am in here

Your Work page images can get overwritten when two preview tabs are open at once, which is the likeliest reason things keep appearing to roll back. I will add a guard so a stale tab cannot overwrite newer saved content.

## Technical notes

- Slug rename: add `nestive -> uber-photography-guidelines` to `SLUG_RENAMES` in `CanvasProvider.tsx`, update `src/data/projects.ts` and the block ids in `src/config/canvas-defaults.ts`, add the old slug to `OLD_SLUG_REDIRECTS` in `work.$slug.tsx`, and migrate saved keys in `site_content` (`canvas.blocks`, `placements`, `styles`, `hidden`, `texts`, `removed`, `media.overrides`).
- Thumbnail: update `src` on `work-project-uber-color-system-image` in `canvas.blocks` to the chosen `/api/public/media/<id>`.
- About audit: diff `canvas.texts` / `bullets.about-*` against `canvas.hidden` and `canvas.removed`; `about-*` vs `resume-*` keys for a surviving older copy.
- Stale-tab guard: version stamp on each `site_content` write, refuse a write whose base version is older than the stored one.
