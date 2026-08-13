import { Router } from "express";

const router = Router();

async function googleTranslate(text: string, target: "tr" | "en"): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map((seg: any) => (Array.isArray(seg) ? seg[0] : "")).join("");
      return translated || text;
    }
    return text;
  } catch {
    return text;
  }
}

router.post("/translate", async (req, res) => {
  const text = String(req.body?.text || "").trim();
  if (!text) {
    res.json({ tr: "", en: "" });
    return;
  }
  const [tr, en] = await Promise.all([googleTranslate(text, "tr"), googleTranslate(text, "en")]);
  res.json({ tr: tr || text, en: en || text });
});

export default router;
