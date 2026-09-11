import { mergeStockEntry } from "../utils/stockPricing";

describe("mergeStockEntry", () => {
  const base = { unitPrice: null as number | null, vatRate: 0 as number | null, unit: "AD" };

  describe("Kural 1: zam geldiğinde yüksek fiyat ve yüksek KDV oranı kazanır", () => {
    it("yeni miktar mevcut fiyattan yüksekse fiyat yeni (yüksek) fiyata güncellenir", () => {
      const r = mergeStockEntry({ ...base, unitPrice: 100, vatRate: 18 }, { unitPrice: 120, vatRate: 20 });
      expect(r.unitPrice).toBe(120);
      expect(r.vatRate).toBe(20);
    });

    it("yeni giriş fiyatı düşükse mevcut yüksek fiyat korunur (fiyat düşürülmez)", () => {
      const r = mergeStockEntry({ ...base, unitPrice: 120, vatRate: 20 }, { unitPrice: 90, vatRate: 18 });
      expect(r.unitPrice).toBe(120);
      expect(r.vatRate).toBe(20);
    });

    it("yeni KDV oranı yüksekse fiyat aynı olsa bile yüksek KDV kazanır", () => {
      const r = mergeStockEntry({ ...base, unitPrice: 100, vatRate: 18 }, { unitPrice: 100, vatRate: 20 });
      expect(r.unitPrice).toBe(100);
      expect(r.vatRate).toBe(20);
    });

    it("mevcut KDV yüksekse düşük KDV'li giriş KDV'yi düşürmez", () => {
      const r = mergeStockEntry({ ...base, unitPrice: 100, vatRate: 20 }, { unitPrice: 100, vatRate: 10 });
      expect(r.vatRate).toBe(20);
    });

    it("zamsız aynı fiyatlı giriş fiyatı değiştirmez", () => {
      const r = mergeStockEntry({ ...base, unitPrice: 100, vatRate: 18 }, { unitPrice: 100, vatRate: 18 });
      expect(r.unitPrice).toBe(100);
      expect(r.vatRate).toBe(18);
    });
  });

  describe("Kural 2: fiyatsız/aynı fiyatlı giriş fiyatı eskisi gibi bırakır", () => {
    it("fiyat bilgisi yoksa mevcut fiyat korunur", () => {
      const r = mergeStockEntry({ ...base, unitPrice: 75, vatRate: 18 }, { unitPrice: null, vatRate: null });
      expect(r.unitPrice).toBe(75);
      expect(r.vatRate).toBe(18);
    });

    it("mevcut fiyat yoksa ve yeni fiyat varsa fiyat belirlenir", () => {
      const r = mergeStockEntry({ ...base, unitPrice: null, vatRate: 0 }, { unitPrice: 50, vatRate: 20 });
      expect(r.unitPrice).toBe(50);
      expect(r.vatRate).toBe(20);
    });

    it("iki taraf da fiyatsızsa fiyat null kalır", () => {
      const r = mergeStockEntry({ ...base, unitPrice: null, vatRate: 0 }, { unitPrice: 0, vatRate: 0 });
      expect(r.unitPrice).toBeNull();
    });

    it("0 fiyat bilinmiyor sayılır ve mevcut fiyat korunur", () => {
      const r = mergeStockEntry({ ...base, unitPrice: 60, vatRate: 18 }, { unitPrice: 0, vatRate: null });
      expect(r.unitPrice).toBe(60);
    });
  });

  describe("birim davranışı", () => {
    it("mevcut birim korunur", () => {
      const r = mergeStockEntry({ ...base, unit: "KG" }, { unit: "AD" });
      expect(r.unit).toBe("KG");
    });

    it("mevcut birim yoksa yeni birim kullanılır", () => {
      const r = mergeStockEntry({ ...base, unit: null }, { unit: "MTR" });
      expect(r.unit).toBe("MTR");
    });

    it("hiçbir birim yoksa AD kullanılır", () => {
      const r = mergeStockEntry({ ...base, unit: null }, { unit: null });
      expect(r.unit).toBe("AD");
    });
  });

  describe("negatif/geçersiz girdiler", () => {
    it("negatif yeni fiyat mevcut fiyata dokunmaz", () => {
      const r = mergeStockEntry({ ...base, unitPrice: 80, vatRate: 18 }, { unitPrice: -5, vatRate: 18 });
      expect(r.unitPrice).toBe(80);
    });

    it("ondalık fiyat korunur", () => {
      const r = mergeStockEntry({ ...base, unitPrice: 73.9, vatRate: 20 }, { unitPrice: 73.9, vatRate: 20 });
      expect(r.unitPrice).toBe(73.9);
    });
  });
});