import apiClient from "./client";

export async function translateLabel(text: string): Promise<{ tr: string; en: string }> {
  try {
    const res = await apiClient.post("/translate", { text });
    return { tr: res.data?.tr || text, en: res.data?.en || text };
  } catch {
    return { tr: text, en: text };
  }
}
