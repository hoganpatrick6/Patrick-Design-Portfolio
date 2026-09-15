# Clean up the oversized saved layout (no content loss)

## What I found

A full reset is not needed — and I don't recommend it. Your saved page data is almost entirely small and healthy. One single item is causing the whole problem:

- A video you added to the Uber Credit Card page is stored **inside** the saved layout as a 16.3 MB block of embedded data.
- Everything else combined (all text, placements, styles, images) is under 30 KB.
- All your images already live in the shared media library, as intended.

That one video is why the layout is too big for the browser to save reliably, which is what makes edits fail to stick and old content come back.

## What I'll do instead of a reset

1. Move that video out of the saved layout and into the shared media library, exactly like your images — same video, same place on the page, nothing visually changes.
2. Point the video block at its new library address, shrinking the saved layout from 16.3 MB to a few KB.
3. Raise the size allowance for future video uploads so the next video also goes straight to the library instead of being embedded.

## Will this affect your latest content?

No. Nothing is deleted or rolled back:

- All text edits, headlines, and project copy stay exactly as they are now.
- All images, placements, sizes, colours, and type settings stay as they are.
- The video keeps playing in the same spot.
- No page returns to defaults.

The only change is *where* the video file is stored.

## After that, clearing browser storage is optional

Once the layout is small again, clearing your browser's stored copy for the preview is a clean way to make sure your open tab starts from the fixed version. Your content lives in the backend, so clearing it loses nothing.

## Technical notes

- Copy the base64 payload of block `block-sxfjfk` (page `project:uber-credit-card`, kind `video`) from `site_content` key `canvas.blocks` into a new `media_files` row, then rewrite that block's `src` to `/api/public/media/<new id>` — done in a single SQL migration so no re-upload is needed.
- Raise `MAX_DATA_URL_LENGTH` in `src/lib/media.functions.ts` and the client-side video ceiling in `src/lib/media-files.ts` so videos of this size upload to the library rather than being rejected/embedded.
- Verify afterwards that `pg_column_size` of `canvas.blocks` drops to the low KB range and the video route serves the file.
