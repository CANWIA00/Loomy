const cache = new Map<string, string>();

async function fetchToDataUrl(src: string): Promise<string | null> {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 6000) : null;
  try {
    const res = await fetch(src, controller ? { signal: controller.signal } : undefined);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob || !blob.size) return null;
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function embedImage(src?: string | null): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith("data:")) return src;
  const cached = cache.get(src);
  if (cached) return cached;
  const dataUrl = await fetchToDataUrl(src);
  if (dataUrl) {
    cache.set(src, dataUrl);
    return dataUrl;
  }
  return src;
}