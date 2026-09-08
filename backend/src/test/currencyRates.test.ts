import { getTcmbRates } from "../controllers/currencyRatesController";
import { Request } from "express";

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const sampleXml = `<?xml version="1.0"?>
<Tarih_Date Tarih="08/09/2026">
  <Currency CurrencyCode="USD">
    <BanknoteSelling>34.1234</BanknoteSelling>
    <ForexSelling>33.9999</ForexSelling>
  </Currency>
  <Currency CurrencyCode="EUR">
    <BanknoteSelling>38.5000</BanknoteSelling>
    <ForexSelling>38.2000</ForexSelling>
  </Currency>
  <Currency CurrencyCode="GBP">
    <BanknoteSelling>44.0000</BanknoteSelling>
    <ForexSelling>43.5000</ForexSelling>
  </Currency>
</Tarih_Date>`;

describe("currencyRates controller", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("parses banknote selling rates from TCMB XML", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => sampleXml,
    }) as unknown as typeof fetch;

    const res = mockRes();
    await getTcmbRates({} as Request, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "TCMB",
        rateDate: "08/09/2026",
        rates: { TRY: 1, USD: 34.1234, EUR: 38.5, GBP: 44 },
      })
    );
  });

  it("falls back to forex selling when banknote missing", async () => {
    const xml = sampleXml.replace(/<BanknoteSelling>[\s\S]*?<\/BanknoteSelling>/g, "");
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => xml,
    }) as unknown as typeof fetch;

    const res = mockRes();
    await getTcmbRates({} as Request, res);

    const result = res.json.mock.calls[0][0];
    expect(result.rates.USD).toBe(33.9999);
  });

  it("returns 502 when fetch fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
    }) as unknown as typeof fetch;

    const res = mockRes();
    await getTcmbRates({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({ message: "TCMB'den yanıt alınamadı." });
  });

  it("returns 502 when no rates parsed", async () => {
    const xml = `<Tarih_Date Tarih="08/09/2026"><Currency CurrencyCode="JPY"><BanknoteSelling>1.0</BanknoteSelling></Currency></Tarih_Date>`;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => xml,
    }) as unknown as typeof fetch;

    const res = mockRes();
    await getTcmbRates({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({ message: "TCMB verisi ayrıştırılamadı." });
  });
});
