import { computeServiceTotal, MissingRateError, roundMoney, resolveProductsModeTotal, sanitizeClientRates } from "../utils/serviceTotals";
import { isZeroFee, selectBackfillCandidates } from "../scripts/backfillServiceTotals";
import * as tcmbRates from "../utils/tcmbRates";
import type { TryRatesData } from "../utils/tcmbRates";

// Gercek convertToTry kullanilir; getTryRates testlerde hep null doner, boylece
// ag cagrisi olmaz. resolveProductsModeTotal yabanci para birimi gordugunde
// getTryRates'e duser, TRY-only durumlar hic cagirmaz.
jest.mock("../utils/tcmbRates", () => ({
  getTryRates: jest.fn(async () => null),
  convertToTry: jest.requireActual("../utils/tcmbRates").convertToTry,
}));

const RATES: TryRatesData = {
  source: "TCMB",
  rateDate: "28/09/2026",
  fetchedAt: Date.now(),
  rates: { TRY: 1, USD: 40, EUR: 45 },
};

describe("computeServiceTotal", () => {
  it("productsMode: urunler + iscilik + KDV ile genel toplam", () => {
    const result = computeServiceTotal(
      {
        productsMode: true,
        usedProducts: [{ quantity: 2, unitPrice: 100, currency: "TRY" }],
        fee: "0.00",
        feeCurrency: "TRY",
        labor: "50",
        laborCurrency: "TRY",
        kdvRate: "20",
      },
      RATES
    );

    expect(result.productTry).toBe(200);
    expect(result.laborTry).toBe(50);
    expect(result.baseTry).toBe(250);
    expect(result.kdvTry).toBe(50);
    expect(result.grandTry).toBe(300);
    expect(result.missingRates).toEqual([]);
  });

  it("productsMode: yabanci para birimini TRY'ye cevirir", () => {
    const result = computeServiceTotal(
      {
        productsMode: true,
        usedProducts: [
          { quantity: 2, unitPrice: 100, currency: "USD" },
          { quantity: 1, unitPrice: 20, currency: "TRY" },
        ],
        fee: "0.00",
        labor: "0",
        kdvRate: "20",
      },
      RATES
    );

    expect(result.productTry).toBe(8020);
    expect(result.kdvTry).toBe(1604);
    expect(result.grandTry).toBe(9624);
  });

  it("productsMode: KDV orani degistirilince toplam degisir", () => {
    const base = {
      productsMode: true,
      usedProducts: [{ quantity: 1, unitPrice: 100, currency: "TRY" }],
      fee: "0.00",
      labor: "0",
    };
    expect(computeServiceTotal({ ...base, kdvRate: "0" }, RATES).grandTry).toBe(100);
    expect(computeServiceTotal({ ...base, kdvRate: "20" }, RATES).grandTry).toBe(120);
  });

  it("productsMode: kur olmayan para birimi hata firlatir (kismi toplam yazilmaz)", () => {
    expect(() =>
      computeServiceTotal(
        {
          productsMode: true,
          usedProducts: [{ quantity: 1, unitPrice: 10, currency: "GBP" }],
          fee: "0.00",
          labor: "0",
          kdvRate: "20",
        },
        RATES
      )
    ).toThrow(MissingRateError);
  });


  it("productsMode disi: fee kullanilir, KDV uygulanmaz", () => {
    const result = computeServiceTotal(
      {
        productsMode: false,
        usedProducts: [],
        fee: "150.50",
        feeCurrency: "TRY",
        labor: "50",
        laborCurrency: "TRY",
        kdvRate: "20",
      },
      RATES
    );

    expect(result.productTry).toBe(150.5);
    expect(result.laborTry).toBe(0);
    expect(result.kdvTry).toBe(0);
    expect(result.grandTry).toBe(150.5);
  });

  it("string ve virgullu sayilari dogru parse eder", () => {
    const result = computeServiceTotal(
      {
        productsMode: true,
        usedProducts: [{ quantity: "3", unitPrice: "10,50", currency: "TRY" }],
        fee: "0.00",
        labor: "0",
        kdvRate: "0",
      },
      RATES
    );

    expect(result.grandTry).toBe(31.5);
  });

  it("negatif / bozuk girdileri sifir sayar", () => {
    const result = computeServiceTotal(
      {
        productsMode: true,
        usedProducts: [{ quantity: "abc", unitPrice: null, currency: "TRY" }],
        fee: "0.00",
        labor: "5",
        laborCurrency: "TRY",
        kdvRate: "20",
      },
      RATES
    );

    expect(result.grandTry).toBe(6);
  });
});

describe("roundMoney", () => {
  it("kuruş hassasiyetinde yuvarlar", () => {
    expect(roundMoney(300)).toBe("300.00");
    expect(roundMoney(9624.005)).toBe("9624.01");
    expect(roundMoney(0.1 + 0.2)).toBe("0.30");
  });
});

describe("resolveProductsModeTotal", () => {
  beforeEach(() => {
    (tcmbRates.getTryRates as jest.Mock).mockClear();
  });

  it("productsMode false ise null doner (fee elle girilmistir)", async () => {
    const total = await resolveProductsModeTotal({
      productsMode: false,
      usedProducts: [],
      fee: "250",
      feeCurrency: "TRY",
      labor: "0",
      kdvRate: "20",
    });
    expect(total).toBeNull();
  });

  it("productsMode true ise genel toplami metin olarak doner", async () => {
    const total = await resolveProductsModeTotal({
      productsMode: true,
      usedProducts: [{ quantity: 2, unitPrice: 100, currency: "TRY" }],
      fee: "0.00",
      feeCurrency: "TRY",
      labor: "50",
      laborCurrency: "TRY",
      kdvRate: "20",
    });
    expect(total).toBe("300.00");
  });

  it("kur gelemediginde null doner, kismi toplam yazmaz", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const total = await resolveProductsModeTotal({
      productsMode: true,
      usedProducts: [{ quantity: 1, unitPrice: 10, currency: "GBP" }],
      fee: "0.00",
      labor: "100",
      laborCurrency: "TRY",
      kdvRate: "20",
    });
    // 100 iscilik + %20 KDV = 120 tutardi, ama kur olmadigi icin yazilmamali.
    expect(total).toBeNull();
    warn.mockRestore();
  });

  // Regresyon: yabanci para birimli urunlerde TCMB cagrisi basarisiz olunca
  // kayit 0.00 ile kaydediliyordu. Frontend'in gonderdigi anlik kur sayesinde
  // hesap TCMB'ye ihtiyac duymadan tamamlanmali.
  it("istemciden gelen anlik kuru kullanir, TCMB'ye baglanmaz", async () => {
    const total = await resolveProductsModeTotal(
      {
        productsMode: true,
        usedProducts: [
          { name: "Kamera", quantity: 2, unitPrice: 100, currency: "USD" },
        ],
        fee: "0.00",
        labor: "0",
        kdvRate: "20",
      },
      { rates: { TRY: 1, USD: 40 }, source: "TCMB", rateDate: "28/09/2026", fetchedAt: Date.now() }
    );
    // 2 * 100 USD = 200 USD * 40 = 8000 TRY, %20 KDV = 1600 -> 9600
    expect(total).toBe("9600.00");
    expect(tcmbRates.getTryRates).not.toHaveBeenCalled();
  });

  it("istemci kuru eksikse TCMB'ye duser", async () => {
    const total = await resolveProductsModeTotal(
      {
        productsMode: true,
        usedProducts: [{ name: "Kamera", quantity: 1, unitPrice: 100, currency: "USD" }],
        fee: "0.00",
        labor: "0",
        kdvRate: "0",
      },
      undefined
    );
    expect(tcmbRates.getTryRates).toHaveBeenCalled();
    // TCMB mock olarak null dondugu icin hesaplanamaz -> null
    expect(total).toBeNull();
  });

  it("TRY-only kayitlar kur paketi istemeden hesaplanir", async () => {
    const total = await resolveProductsModeTotal(
      {
        productsMode: true,
        usedProducts: [{ name: "Kamera", quantity: 1, unitPrice: 250, currency: "TRY" }],
        fee: "0.00",
        labor: "50",
        laborCurrency: "TRY",
        kdvRate: "20",
      },
      undefined
    );
    expect(total).toBe("360.00");
    expect(tcmbRates.getTryRates).not.toHaveBeenCalled();
  });
});

describe("sanitizeClientRates", () => {
  it("yalnizca gerekli para birimlerini alir", () => {
    const r = sanitizeClientRates({ rates: { TRY: 1, USD: 40, EUR: 55 } }, ["USD"]);
    expect(r?.rates).toEqual({ TRY: 1, USD: 40 });
  });

  it("istenen kur eksikse null doner", () => {
    expect(sanitizeClientRates({ rates: { TRY: 1, USD: 40 } }, ["GBP"])).toBeNull();
  });

  it("gecersiz/olceklenmis kurlari reddeder", () => {
    expect(sanitizeClientRates({ rates: { USD: 0 } }, ["USD"])).toBeNull();
    expect(sanitizeClientRates({ rates: { USD: -5 } }, ["USD"])).toBeNull();
    expect(sanitizeClientRates({ rates: { USD: "abc" } }, ["USD"])).toBeNull();
    expect(sanitizeClientRates({ rates: { USD: 1e12 } }, ["USD"])).toBeNull();
  });

  it("input bicimi yanlissa null doner", () => {
    expect(sanitizeClientRates(null, ["USD"])).toBeNull();
    expect(sanitizeClientRates({ rates: "x" }, ["USD"])).toBeNull();
    expect(sanitizeClientRates({}, ["USD"])).toBeNull();
  });
});


describe("backfill aday secimi", () => {
  it("fee 0 olanlari aday yapar", () => {
    expect(isZeroFee("0.00")).toBe(true);
    expect(isZeroFee("0")).toBe(true);
    expect(isZeroFee("0,00")).toBe(true);
    expect(isZeroFee("")).toBe(true);
    expect(isZeroFee(null)).toBe(true);
    expect(isZeroFee(undefined)).toBe(true);
  });

  it("fee dolu olanlari aday yapmaz", () => {
    expect(isZeroFee("150.50")).toBe(false);
    expect(isZeroFee("0.01")).toBe(false);
    expect(isZeroFee("-5")).toBe(false);
  });

  it("sadece sifir fee'li kayitlari secer", () => {
    const records = [
      { id: 1, fee: "0.00" },
      { id: 2, fee: "250.00" },
      { id: 3, fee: "0" },
      { id: 4, fee: "12.34" },
    ];
    expect(selectBackfillCandidates(records).map((r) => r.id)).toEqual([1, 3]);
  });
});
