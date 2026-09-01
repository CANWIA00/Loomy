import { Request, Response } from "express";

const CURRENCIES = ["USD", "EUR", "GBP"];

function parseRate(value: string | undefined): number | null {
  if (!value) return null;
  const num = parseFloat(value.trim().replace(",", "."));
  return isNaN(num) ? null : num;
}

export async function getTcmbRates(_req: Request, res: Response): Promise<void> {
  try {
    const r = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      headers: {
        Accept: "application/xml",
        "User-Agent": "Mozilla/5.0 (ManagementDashboard)",
      },
    });
    if (!r.ok) {
      res.status(502).json({ message: "TCMB'den yanıt alınamadı." });
      return;
    }
    const xml = await r.text();
    const dateMatch = xml.match(/<Tarih_Date[^>]*Tarih="([^"]+)"/);
    const rateDate = dateMatch?.[1] || new Date().toLocaleDateString("tr-TR");
    const rates: Record<string, number> = { TRY: 1 };
    for (const code of CURRENCIES) {
      const blockMatch = xml.match(new RegExp(`<Currency[^>]*CurrencyCode="${code}"[^>]*>([\\s\\S]*?)<\\/Currency>`));
      if (!blockMatch) continue;
      const block = blockMatch[1];
      const banknoteSelling = block.match(/<BanknoteSelling>\s*([\d.]+)/);
      const forexSelling = block.match(/<ForexSelling>\s*([\d.]+)/);
      const rate = parseRate(banknoteSelling?.[1]) ?? parseRate(forexSelling?.[1]);
      if (rate) rates[code] = rate;
    }
    if (!rates.USD && !rates.EUR && !rates.GBP) {
      res.status(502).json({ message: "TCMB verisi ayrıştırılamadı." });
      return;
    }
    res.json({ source: "TCMB", rateDate, rates, fetchedAt: Date.now() });
  } catch (error: any) {
    console.error("getTcmbRates error:", error);
    res.status(500).json({ message: "Kur alınamadı: " + error.message });
  }
}