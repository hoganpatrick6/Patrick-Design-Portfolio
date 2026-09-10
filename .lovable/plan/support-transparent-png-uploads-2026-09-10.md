# Support transparent PNG uploads

## Problem
`src/lib/media-files.ts` → `fileToImageDataUrl` re-encodes every uploaded raster image to JPEG (`canvas.toDataURL("image/jpeg", 0.85)`). JPEG has no alpha channel, so transparent regions of a PNG are filled with a flat background (black by default on canvas). Transparent PNGs uploaded via the Media / Replace tools lose their transparency.

## Goal
Let transparent PNGs keep their alpha channel through upload, both for new media blocks and when replacing existing images. GIFs and SVGs are already preserved untouched.

## Change
In `src/lib/media-files.ts`:

1. Detect PNG sources that may carry transparency — `file.type === "image/png"`.
2. For PNGs, output with `canvas.toDataURL("image/png")` instead of JPEG so the canvas's transparent pixels stay transparent (the canvas is never filled with a background, so alpha is preserved).
3. Keep JPEG encoding for all other raster formats (jpg, webp input, etc.) to stay compact.
4. Optionally cap the PNG max dimension at the existing 1800px downscale so very large PNGs don't balloon — reuse the existing `max` logic (already applies before encoding).

Resulting logic (sketch):

```ts
const isPng = file.type === "image/png";
// ... draw to canvas ...
return canvas.toDataURL(isPng ? "image/png" : "image/jpeg", isPng ? undefined : 0.85);
```

No other files need editing — data URLs are stored and rendered as-is, and the cropper (`CroppableImage`) already preserves alpha because it draws to an un-filled canvas.

## Files touched
- `src/lib/media-files.ts` (only file changed)

## Verification
- `bunx tsgo --noEmit`
- Build OK check
- Playwright: upload a known transparent PNG into a media block on `/work` and confirm it renders with transparency (checkerboard or page background shows through), not a black/white box.
