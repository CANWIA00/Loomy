import { Request, Response } from "express";
import { sendApplicationEmail } from "../services/email";

const hits = new Map<string, { count: number; resetAt: number }>();

export function resetApplyRateLimits(): void {
  hits.clear();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitApplication(req: Request, res: Response): Promise<void> {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const max = parseInt(process.env.APPLY_MAX_PER_HOUR || "5", 10);
  const windowMs = 60 * 60 * 1000;

  const entry = hits.get(ip);
  if (entry) {
    if (now < entry.resetAt) {
      if (entry.count >= max) {
        res.status(429).json({ message: "Çok fazla başvuru gönderdiniz. Lütfen bir saat sonra tekrar deneyin." });
        return;
      }
      entry.count += 1;
    } else {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
    }
  } else {
    hits.set(ip, { count: 1, resetAt: now + windowMs });
  }

  const body = req.body || {};
  const businessName = String(body.businessName || "").trim();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const message = String(body.message || "").trim();

  if (!businessName || !name || !email || !message) {
    res.status(400).json({ message: "İşletme adı, ad soyad, e-posta ve mesaj zorunludur." });
    return;
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ message: "Geçerli bir e-posta adresi girin." });
    return;
  }
  if (
    businessName.length > 120 ||
    name.length > 120 ||
    phone.length > 40 ||
    message.length > 2000
  ) {
    res.status(400).json({ message: "Bazı alanlar izin verilen uzunluğu aşıyor." });
    return;
  }

  try {
    await sendApplicationEmail({ businessName, name, email, phone, message });
    res.json({ success: true, message: "Başvurunuz alındı. En kısa sürede size dönüş yapacağız." });
  } catch {
    res.status(500).json({ message: "Başvuru gönderilemedi. Lütfen daha sonra tekrar deneyin." });
  }
}