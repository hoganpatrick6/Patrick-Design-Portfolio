/** Shared helpers for turning local files into storable data URLs. */

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function isPngFile(file: File): Promise<boolean> {
  if (file.type.toLowerCase() === "image/png" || /\.png$/i.test(file.name)) {
    return true;
  }

  const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  return (
    signature.length === 8 &&
    signature[0] === 0x89 &&
    signature[1] === 0x50 &&
    signature[2] === 0x4e &&
    signature[3] === 0x47 &&
    signature[4] === 0x0d &&
    signature[5] === 0x0a &&
    signature[6] === 0x1a &&
    signature[7] === 0x0a
  );
}

/** Downscales an image file and returns a compact data URL. GIF/SVG untouched.
 *  PNGs keep their alpha channel (encoded as PNG); other rasters become JPEG. */
export async function fileToImageDataUrl(file: File): Promise<string> {
  const raw = await fileToDataUrl(file);
  if (file.type === "image/svg+xml" || file.type === "image/gif") return raw;

  // Some browsers and drag sources omit or misreport the MIME type. Detect PNGs
  // before drawing so they are never accidentally flattened into a JPEG.
  const isPng = await isPngFile(file);

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
  if (isPng) return canvas.toDataURL("image/png");
  return canvas.toDataURL("image/jpeg", 0.85);
}
