# Why images stopped loading — and how to fix it

## What I found

Your images aren't broken. The backend that stores them is not responding right now.

Confirmed just now:
- Every image request (for example `/api/public/media/fac95b94-…`) comes back "not found".
- Saved page content also comes back empty, which is the same symptom from the same source.
- Direct checks against the backend time out: the database answers nothing, while the project itself reports as running and not paused.

So the pages render, but anything stored in the backend — images and saved layout/text — can't be read.

## Most likely cause

All of your uploaded images and videos are stored **inside the database itself** as encoded text, on the smallest database tier. That includes multi-megabyte video files. That is a heavy load for this tier and is the kind of thing that pushes it into an unresponsive state.

## Plan

1. **Restore service first.** Restart the backend and wait for it to accept queries again, then confirm a sample image URL returns the picture and saved content loads. Nothing is deleted in this step; your data is intact on disk.
2. **Confirm nothing was lost.** Count the stored media files and saved content keys, and reload Work and a project page to verify images and text are all back.
3. **Take the weight off the database.** Move stored media out of the database and into proper file storage, keeping the same public addresses so nothing on any page has to change visually. Uploads after that go straight to file storage.
4. **Clean up duplicates.** From the earlier audit, roughly 22 of the stored files are duplicates and about 12 are unreferenced; remove those once media lives in file storage.

Steps 3 and 4 are what stop this from happening again — step 1 is the immediate fix.

## Technical notes

- Symptoms: `/api/public/media/$id` → 404; `loadSiteContent` returns `{}`; REST reads on `media_files` and `site_content` time out (curl exit 28); pooler unavailable; `db_health` metrics request times out; `project_info` reports `Paused: false`.
- Recovery: `supabase--restart`, then poll `read_query` until it answers; verify `select count(*) from media_files` and `site_content`.
- Migration: create a public storage bucket, stream each `media_files` row's base64 into it under the existing id, and change the `/api/public/media/$id` route to redirect to (or proxy) the stored object; `uploadMediaFile` in `src/lib/media.functions.ts` writes to the bucket instead of the table. Keep URLs stable so saved blocks need no rewrite.
- Drop the base64 `data` column only after the bucket copy is verified for every row.
