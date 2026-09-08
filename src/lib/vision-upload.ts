/** Prepare a camera/library photo for vision APIs (Safari iPhone HEIC + large files). */

const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.82;
const MAX_BYTES = 4.5 * 1024 * 1024;

async function canvasToJpegFile(
  canvas: HTMLCanvasElement,
  name: string,
): Promise<File> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new Error("Could not encode photo as JPEG.");
  const base = name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

async function loadImageSource(
  file: File,
): Promise<CanvasImageSource & { width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return bitmap;
    } catch {
      // Fall through — HEIC sometimes fails here on older Safari
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(new Error("Could not read this photo. Try a JPEG or PNG."));
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Re-encode to JPEG and downscale so uploads finish under the vision timeout
 * on Safari/iPhone (HEIC + multi‑MB camera shots).
 */
export async function prepareVisionUpload(file: File): Promise<File> {
  if (typeof window === "undefined") return file;

  const type = (file.type || "").toLowerCase();
  const alreadySmallJpeg =
    (type === "image/jpeg" || type === "image/jpg") && file.size <= MAX_BYTES;

  // Still re-encode oversized JPEGs; skip tiny ones.
  if (alreadySmallJpeg && file.size < 1.5 * 1024 * 1024) return file;

  const source = await loadImageSource(file);
  const srcW = "naturalWidth" in source ? source.naturalWidth : source.width;
  const srcH = "naturalHeight" in source ? source.naturalHeight : source.height;
  if (!srcW || !srcH) {
    throw new Error("Could not read this photo. Try a JPEG or PNG.");
  }

  const scale = Math.min(1, MAX_EDGE_PX / Math.max(srcW, srcH));
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process photo.");
  ctx.drawImage(source, 0, 0, width, height);

  if ("close" in source && typeof source.close === "function") {
    source.close();
  }

  const prepared = await canvasToJpegFile(canvas, file.name || "photo");
  if (prepared.size > MAX_BYTES) {
    throw new Error("Photo is still too large after compression. Try another shot.");
  }
  return prepared;
}
