"use client";

const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.7;

/** Réduit la taille des images avant envoi à l’API (moins de tokens / coût). PDF inchangé. */
export async function maybeCompressImageForUpload(file: File): Promise<File> {
  if (file.type === "application/pdf") return file;
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif") return file;
  if (file.type === "image/heic" || file.type === "image/heif") return file;

  try {
    const img = await createImageBitmap(file);
    const scale = Math.min(MAX_EDGE / img.width, MAX_EDGE / img.height, 1);
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, w, h);
    img.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY);
    });
    if (!blob || blob.size === 0) return file;

    const base = file.name.replace(/\.[^.]+$/i, "") || "menu";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
