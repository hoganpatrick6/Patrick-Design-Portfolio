/** Shared helpers for turning local files into storable data URLs. */

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Downscales an image file and returns a compact data URL. GIF/SVG untouched.
 *  PNGs keep their alpha channel (encoded as PNG); other rasters become JPEG. */
export async function fileToImageDataUrl(file: File): Promise<string> {
  const raw = await fileToDataUrl(file);
  if (file.type === "image/svg+xml" || file.type === "image/gif") return raw;

  const img = new Image();
  img.src = raw;
  try {
    await img.decode();
  } catch {
    return raw;
  }
  const max = 1800;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  // PNG preserves transparency; other raster formats flatten to compact JPEG.
  const isPng = file.type === "image/png";
  return canvas.toDataURL(isPng ? "image/png" : "image/jpeg", isPng ? undefined : 0.85);
}
