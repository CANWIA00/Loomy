import {
  REASON_SERVICE,
  normalizeUsedProductInput,
  parseUsedProducts,
  applyUsedProductsTx,
  reverseUsedProductsTx,
} from "../services/serviceUsedProducts";

function makeTx() {
  const stockItem = {
    findFirst: jest.fn(),
    update: jest.fn(async ({ data }: any) => data),
  };
  const stockTransaction = {
    create: jest.fn(async ({ data }: any) => ({ id: 99, ...data })),
    delete: jest.fn(async () => ({})),
  };
  return { stockItem, stockTransaction } as any;
}

describe("serviceUsedProducts helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("normalizeUsedProductInput", () => {
    it("keeps valid products and drops invalid ones", () => {
      const result = normalizeUsedProductInput([
        { name: "Kablo", quantity: 2, unitPrice: "15.5" },
        { name: "", quantity: 3 },
        { name: "Cihaz", quantity: 0 },
        { name: "Sensor", quantity: "4", unitPrice: null },
        null,
        { quantity: 5 },
      ]);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: "Kablo", quantity: 2, unitPrice: 15.5, unit: undefined, currency: undefined, vatRate: null });
      expect(result[1]).toMatchObject({ name: "Sensor", quantity: 4, unitPrice: null });
    });

    it("returns empty array for non-array input", () => {
      expect(normalizeUsedProductInput(undefined)).toEqual([]);
      expect(normalizeUsedProductInput("x")).toEqual([]);
    });
  });

  describe("parseUsedProducts", () => {
    it("parses valid json", () => {
      const arr = parseUsedProducts('[{"name":"Kablo","quantity":2}]');
      expect(arr).toHaveLength(1);
      expect(arr[0].name).toBe("Kablo");
    });

    it("returns empty array on invalid json", () => {
      expect(parseUsedProducts("not json")).toEqual([]);
      expect(parseUsedProducts(null)).toEqual([]);
    });
  });

  describe("applyUsedProductsTx", () => {
    it("deducts stock and creates SERVICE transaction for in-stock product", async () => {
      const tx = makeTx();
      tx.stockItem.findFirst.mockResolvedValue({
        id: 5,
        quantity: 100,
        currency: "TRY",
        vatRate: 20,
      });

      const resolved = await applyUsedProductsTx(tx, "c1", 7, null, [
        { name: "Kablo", quantity: 2, unitPrice: 10 },
      ]);

      expect(tx.stockItem.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { quantity: 98 },
      });
      expect(tx.stockTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stockItemId: 5,
          change: -2,
          reason: REASON_SERVICE,
          unitPrice: 10,
          currency: "TRY",
          vatRate: 20,
          note: "Servis kaydı #7",
          companyId: "c1",
        }),
      });
      expect(resolved).toHaveLength(1);
      expect(resolved[0]).toMatchObject({
        name: "Kablo",
        quantity: 2,
        stockItemId: 5,
        inStock: true,
        deducted: true,
        transactionId: 99,
      });
    });

    it("does NOT deduct and flags inStock=false when product not in stock", async () => {
      const tx = makeTx();
      tx.stockItem.findFirst.mockResolvedValue(null);

      const resolved = await applyUsedProductsTx(tx, "c1", 7, null, [
        { name: "Bulunmayan Urun", quantity: 3 },
      ]);

      expect(tx.stockTransaction.create).not.toHaveBeenCalled();
      expect(tx.stockItem.update).not.toHaveBeenCalled();
      expect(resolved[0]).toMatchObject({
        name: "Bulunmayan Urun",
        stockItemId: null,
        inStock: false,
        deducted: false,
        transactionId: null,
      });
    });

    it("reverses old deductions before applying the new list", async () => {
      const tx = makeTx();
      // reverse pass: find the previously deducted item
      tx.stockItem.findFirst.mockResolvedValueOnce({ id: 3, quantity: 50 })
        // apply pass: find the new item by name
        .mockResolvedValueOnce({ id: 6, quantity: 20, currency: "TRY", vatRate: 0 });

      const oldJson = JSON.stringify([
        { name: "Eski Urun", quantity: 2, stockItemId: 3, inStock: true, deducted: true, transactionId: 11 },
      ]);

      const resolved = await applyUsedProductsTx(tx, "c1", 7, oldJson, [
        { name: "Yeni Urun", quantity: 1 },
      ]);

      // reversal: stock restored by +2 and transaction 11 deleted
      expect(tx.stockItem.update).toHaveBeenNthCalledWith(1, {
        where: { id: 3 },
        data: { quantity: 52 },
      });
      expect(tx.stockTransaction.delete).toHaveBeenCalledWith({ where: { id: 11 } });
      // new deduction
      expect(tx.stockItem.update).toHaveBeenNthCalledWith(2, {
        where: { id: 6 },
        data: { quantity: 19 },
      });
      expect(tx.stockTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ stockItemId: 6, change: -1 }),
      });
      expect(resolved[0]).toMatchObject({ name: "Yeni Urun", stockItemId: 6, transactionId: 99 });
    });
  });

  describe("reverseUsedProductsTx", () => {
    it("restores stock and deletes previously deducted transactions", async () => {
      const tx = makeTx();
      tx.stockItem.findFirst.mockResolvedValue({ id: 3, quantity: 50 });

      const reversed = await reverseUsedProductsTx(
        tx,
        "c1",
        JSON.stringify([
          { name: "Eski", quantity: 2, stockItemId: 3, inStock: true, deducted: true, transactionId: 11 },
          { name: "Yok", stockItemId: null, inStock: false, deducted: false, transactionId: null },
        ])
      );

      expect(reversed).toBe(true);
      expect(tx.stockItem.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { quantity: 52 },
      });
      expect(tx.stockTransaction.delete).toHaveBeenCalledWith({ where: { id: 11 } });
      expect(tx.stockTransaction.delete).toHaveBeenCalledTimes(1);
    });

    it("returns false when nothing was deducted", async () => {
      const tx = makeTx();
      const reversed = await reverseUsedProductsTx(tx, "c1", "[]");
      expect(reversed).toBe(false);
      expect(tx.stockItem.update).not.toHaveBeenCalled();
    });
  });
});