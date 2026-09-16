# Export all media library files as downloadable files

## Goal
Take every image and video stored in the site's shared media library (the backend) and give them to you as real files you can download — nothing on the site changes.

## Steps
1. Read every file from the media library in the backend, including its type (PNG, JPEG, video, etc.).
2. Decode each one back into its original file and give it a sensible filename (e.g. `media-1.png`, `media-2.jpg`, `video-3.mp4`).
3. Bundle them into a single zip so you can download everything at once from the Files panel.
4. Also produce a small list showing which file belongs to which media link, so you can match them to where they appear on the site.

## What does not change
- No edits to the site, pages, or saved layout.
- Nothing is deleted from the media library — the site keeps working exactly as it does now.

## Technical details
- Query `media_files` (id, content_type, data) via the backend; decode base64 to bytes; extension from content_type.
- Write files under `/mnt/documents/media-export/` and zip to `/mnt/documents/media-export.zip`.
- Include a `manifest.csv` mapping each filename to its `/api/public/media/<id>` URL.
