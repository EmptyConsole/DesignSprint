// Shrinks photos before upload: faster requests, lower API cost, same accuracy.

const MAX_SIDE = 1024;
const THUMB_SIDE = 160;

function draw(source: CanvasImageSource, w: number, h: number, maxSide: number, quality: number): string {
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export function captureVideoFrame(video: HTMLVideoElement): string {
  return draw(video, video.videoWidth, video.videoHeight, MAX_SIDE, 0.82);
}

export async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    return draw(bitmap, bitmap.width, bitmap.height, MAX_SIDE, 0.82);
  } finally {
    bitmap.close();
  }
}

export async function makeThumb(dataUrl: string): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  return draw(img, img.naturalWidth, img.naturalHeight, THUMB_SIDE, 0.7);
}
