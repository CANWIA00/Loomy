function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

export async function removeWhiteBackground(dataUri: string): Promise<string> {
  if (typeof document === "undefined" || typeof Image === "undefined") {
    return dataUri;
  }

  try {
    const img = await loadImageElement(dataUri);

    const MAX = 800;
    const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUri;

    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] >= 235 && data[i + 1] >= 235 && data[i + 2] >= 235) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return dataUri;
  }
}
