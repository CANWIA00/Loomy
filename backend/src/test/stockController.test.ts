import {
  importInvoiceXml,
  addStockTransaction,
  deleteInvoice,
  updateStockItem,
  listStockItems,
} from "../controllers/stockController";
import prisma from "../prisma";

const model = () => ({
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
});

jest.mock("../prisma", () => {
  const model = () => ({
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  });
  const invoice = model();
  const invoiceLine = model();
  const stockItem = model();
  const stockTransaction = model();
  return {
    __esModule: true,
    default: {
      invoice,
      invoiceLine,
      stockItem,
      stockTransaction,
      company: model(),
      $queryRaw: jest.fn(),
      $transaction: jest.fn((fn: (tx: any) => Promise<unknown>) =>
        fn({ invoice, invoiceLine, stockItem, stockTransaction })
      ),
    },
  };
});

function mockRes() {
  const res: any = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

function mockReq(partial: Record<string, unknown> = {}): any {
  return {
    user: { id: "user-1", companyId: "company-1" },
    params: {},
    query: {},
    body: {},
    ...partial,
  };
}

function xmlOf(opts: { invoiceNo?: string; lineName?: string; qty?: number; price?: number; vat?: number } = {}) {
  const { invoiceNo = "FTR-001", lineName = "SÜT", qty = 4, price = 30, vat = 18 } = opts;
  const lineAmount = qty * price;
  return `<?xml version="1.0"?>
<Invoice xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <ID>${invoiceNo}</ID>
  <IssueDate>2026-09-10</IssueDate>
  <AccountingSupplierParty><Party><PartyLegalEntity><RegistrationName>TEDAŞ</RegistrationName><CompanyID>123</CompanyID></PartyLegalEntity></Party></AccountingSupplierParty>
  <TaxTotal><TaxAmount currencyID="TRY">${(lineAmount * vat / 100).toFixed(2)}</TaxAmount></TaxTotal>
  <LegalMonetaryTotal><PayableAmount currencyID="TRY">${(lineAmount * (1 + vat / 100)).toFixed(2)}</PayableAmount></LegalMonetaryTotal>
  <InvoiceLine>
    <ID>1</ID>
    <InvoicedQuantity unitCode="C62">${qty}</InvoicedQuantity>
    <LineExtensionAmount currencyID="TRY">${lineAmount}</LineExtensionAmount>
    <TaxTotal><TaxSubtotal><Percent>${vat}</Percent></TaxSubtotal></TaxTotal>
    <Item><Name>${lineName}</Name></Item>
    <Price><PriceAmount currencyID="TRY">${price}</PriceAmount></Price>
  </InvoiceLine>
</Invoice>`;
}

const existingItem = (o: Partial<Record<string, unknown>> = {}) => ({
  id: 10,
  name: "SÜT",
  unit: "AD",
  quantity: 5,
  unitPrice: 30,
  vatRate: 18,
  currency: "TRY",
  supplierName: null,
  supplierTaxNumber: null,
  lastInvoiceNo: null,
  lastInvoiceDate: null,
  lowStockAlert: true,
  companyId: "company-1",
  ...o,
});

function lastUpdateData() {
  const call = (prisma.stockItem.update as jest.Mock).mock.calls[0][0];
  return call?.data;
}

beforeEach(() => {
  jest.clearAllMocks();
  (prisma.stockItem.create as jest.Mock).mockResolvedValue({ id: 10, quantity: 4 });
  (prisma.stockItem.update as jest.Mock).mockResolvedValue({ id: 10, quantity: 9 });
});

describe("importInvoiceXml", () => {
  it("yeni ürünü faturadaki fiyat ve KDV ile oluşturur", async () => {
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.stockItem.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.invoice.create as jest.Mock).mockResolvedValue({ id: 1, invoiceNo: "FTR-001" });

    const res = mockRes();
    await importInvoiceXml(mockReq({ body: { xml: xmlOf() } }), res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.created).toBe(1);
    expect(body.updated).toBe(0);

    const createData = (prisma.stockItem.create as jest.Mock).mock.calls[0][0]?.data;
    expect(createData).toMatchObject({
      name: "SÜT",
      quantity: 4,
      unitPrice: 30,
      vatRate: 18,
      currency: "TRY",
    });

    const lineData = (prisma.invoiceLine.create as jest.Mock).mock.calls[0][0]?.data;
    expect(lineData).toMatchObject({ vatRate: 18, quantity: 4, stockItemId: 10 });

    const txData = (prisma.stockTransaction.create as jest.Mock).mock.calls[0][0]?.data;
    expect(txData).toMatchObject({ change: 4, reason: "INVOICE", unitPrice: 30, vatRate: 18, vatAmount: 21.6 });
  });

  it("Kural 1: zam gelmişse mevcut ürünün fiyatı ve KDV oranı yüksek olana güncellenir", async () => {
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.stockItem.findFirst as jest.Mock).mockResolvedValue(existingItem()); // 30₺ %18
    (prisma.invoice.create as jest.Mock).mockResolvedValue({ id: 1, invoiceNo: "FTR-001" });

    const res = mockRes();
    await importInvoiceXml(mockReq({ body: { xml: xmlOf({ price: 40, vat: 20 }) } }), res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.updated).toBe(1);
    expect(lastUpdateData()).toMatchObject({
      quantity: { increment: 4 },
      unitPrice: 40,
      vatRate: 20,
    });
  });

  it("Kural 2: aynı fiyattan gelirse sadece miktar artar, fiyat değişmez", async () => {
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.stockItem.findFirst as jest.Mock).mockResolvedValue(existingItem());
    (prisma.invoice.create as jest.Mock).mockResolvedValue({ id: 1, invoiceNo: "FTR-001" });

    const res = mockRes();
    await importInvoiceXml(mockReq({ body: { xml: xmlOf({ price: 30, vat: 18 }) } }), res);

    expect(lastUpdateData()).toMatchObject({
      quantity: { increment: 4 },
      unitPrice: 30,
      vatRate: 18,
    });
  });

  it("daha düşük fiyatlı faturala gelen ürün yüksek mevcut fiyatı düşürmez", async () => {
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.stockItem.findFirst as jest.Mock).mockResolvedValue(existingItem({ unitPrice: 50, vatRate: 20 }));
    (prisma.invoice.create as jest.Mock).mockResolvedValue({ id: 1, invoiceNo: "FTR-001" });

    const res = mockRes();
    await importInvoiceXml(mockReq({ body: { xml: xmlOf({ price: 25, vat: 10 }) } }), res);

    expect(lastUpdateData()).toMatchObject({ quantity: { increment: 4 }, unitPrice: 50, vatRate: 20 });
  });

  it("fiyat aynı kalsa bile daha yüksek KDV oranı her zaman kazanır", async () => {
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.stockItem.findFirst as jest.Mock).mockResolvedValue(existingItem()); // 30₺ %18
    (prisma.invoice.create as jest.Mock).mockResolvedValue({ id: 1, invoiceNo: "FTR-001" });

    const res = mockRes();
    await importInvoiceXml(mockReq({ body: { xml: xmlOf({ price: 30, vat: 20 }) } }), res);

    expect(lastUpdateData()).toMatchObject({ unitPrice: 30, vatRate: 20 });
  });

  it("aynen aynı fatura numarası ikinci kez yüklenemez (409)", async () => {
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({ id: 1, invoiceNo: "FTR-001" });

    const res = mockRes();
    await importInvoiceXml(mockReq({ body: { xml: xmlOf() } }), res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(prisma.stockItem.create).not.toHaveBeenCalled();
  });

  it("geçersiz/boş XML için 400 döner", async () => {
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);

    const res = mockRes();
    await importInvoiceXml(mockReq({ body: { xml: "<Foo></Foo>" } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.message).toBeTruthy();
  });

  it("ürün satırı olmayan fatura için 400 döner", async () => {
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);

    const res = mockRes();
    await importInvoiceXml(
      mockReq({
        body: {
          xml: `<?xml version="1.0"?><Invoice xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"><ID>X</ID></Invoice>`,
        },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(String((res.json as jest.Mock).mock.calls[0][0].message)).toContain("ürün satırı");
  });

  it("dryRun modunda veritabanına yazmadan önizleme döner", async () => {
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);

    const res = mockRes();
    await importInvoiceXml(mockReq({ body: { xml: xmlOf(), dryRun: true } }), res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.invoice).toMatchObject({ invoiceNo: "FTR-001" });
    expect(prisma.stockItem.create).not.toHaveBeenCalled();
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });
});

describe("addStockTransaction (manuel giriş)", () => {
  const stockReq = () =>
    mockReq({ params: { id: "5" }, body: { change: 5, note: "", unitPrice: "", currency: "TRY" } });

  it("fiyat verilmeden giriş yapılırsa sadece miktar güncellenir", async () => {
    (prisma.stockItem.findFirst as jest.Mock).mockResolvedValue(
      existingItem({ id: 5, quantity: 10, unitPrice: 100, vatRate: 18 })
    );

    const res = mockRes();
    await addStockTransaction(stockReq(), res);

    expect(res.status).not.toHaveBeenCalledWith(400);
    expect(lastUpdateData()).toEqual({ quantity: 15 });
  });

  it("yüksek fiyatlı manuel girişte fiyat yukarı güncellenir", async () => {
    (prisma.stockItem.findFirst as jest.Mock).mockResolvedValue(
      existingItem({ id: 5, quantity: 10, unitPrice: 100, vatRate: 18 })
    );

    const res = mockRes();
    await addStockTransaction(
      mockReq({ params: { id: "5" }, body: { change: 5, note: "", unitPrice: "120", currency: "TRY" } }),
      res
    );

    expect(lastUpdateData()).toMatchObject({ quantity: 15, unitPrice: 120 });
    const tx = (prisma.stockTransaction.create as jest.Mock).mock.calls[0][0]?.data;
    expect(tx).toMatchObject({ change: 5, unitPrice: 120, vatAmount: 108 });
  });

  it("düşük fiyatlı manuel giriş mevcut fiyatı düşürmez", async () => {
    (prisma.stockItem.findFirst as jest.Mock).mockResolvedValue(
      existingItem({ id: 5, quantity: 10, unitPrice: 100, vatRate: 18 })
    );

    const res = mockRes();
    await addStockTransaction(
      mockReq({ params: { id: "5" }, body: { change: 5, note: "", unitPrice: "80", currency: "TRY" } }),
      res
    );

    expect(lastUpdateData()).toMatchObject({ quantity: 15, unitPrice: 100 });
  });

  it("çıkış işlemi fiyatı değiştirmez, sadece miktarı azaltır", async () => {
    (prisma.stockItem.findFirst as jest.Mock).mockResolvedValue(
      existingItem({ id: 5, quantity: 10, unitPrice: 100, vatRate: 18 })
    );

    const res = mockRes();
    await addStockTransaction(
      mockReq({ params: { id: "5" }, body: { change: -3, note: "", unitPrice: "", currency: "TRY" } }),
      res
    );

    expect(res.status).not.toHaveBeenCalledWith(400);
    expect(lastUpdateData()).toEqual({ quantity: 7 });
  });

  it("geçersiz miktar (0) için 400 döner", async () => {
    (prisma.stockItem.findFirst as jest.Mock).mockResolvedValue(existingItem({ id: 5 }));

    const res = mockRes();
    await addStockTransaction(
      mockReq({ params: { id: "5" }, body: { change: 0, note: "", unitPrice: "", currency: "TRY" } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("ürün bulunamazsa 404 döner", async () => {
    (prisma.stockItem.findFirst as jest.Mock).mockResolvedValue(null);

    const res = mockRes();
    await addStockTransaction(stockReq(), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("deleteInvoice", () => {
  it("fatura silinirken stok miktarları geri alınır (revert)", async () => {
    (prisma.invoice.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      transactions: [
        { stockItemId: 5, change: 4 },
        { stockItemId: 6, change: 2 },
      ],
    });

    const res = mockRes();
    await deleteInvoice(mockReq({ params: { id: "1" } }), res);

    expect(prisma.stockItem.update).toHaveBeenCalledTimes(2);
    expect(prisma.stockItem.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { quantity: { decrement: 4 } },
    });
    expect(prisma.stockItem.update).toHaveBeenCalledWith({
      where: { id: 6 },
      data: { quantity: { decrement: 2 } },
    });
    expect(prisma.invoice.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("revertStock=false ise stok değiştirilmeden fatura silinir", async () => {
    (prisma.invoice.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      transactions: [{ stockItemId: 5, change: 4 }],
    });

    const res = mockRes();
    await deleteInvoice(mockReq({ params: { id: "1" }, query: { revertStock: "false" } }), res);

    expect(prisma.stockItem.update).not.toHaveBeenCalled();
    expect(prisma.invoice.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("fatura yoksa 404 döner", async () => {
    (prisma.invoice.findFirst as jest.Mock).mockResolvedValue(null);

    const res = mockRes();
    await deleteInvoice(mockReq({ params: { id: "999" } }), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("updateStockItem", () => {
  it("miktar değişirse yeni miktarı kaydeder ve MANUAL işlem oluşturur", async () => {
    (prisma.stockItem.findFirst as jest.Mock).mockResolvedValue(existingItem({ quantity: 10 }));
    (prisma.stockItem.update as jest.Mock).mockResolvedValue({ id: 10, quantity: 15 });

    const res = mockRes();
    await updateStockItem(mockReq({ params: { id: "10" }, body: { name: "SÜT", quantity: 15 } }), res);

    expect(res.status).not.toHaveBeenCalled();
    expect(lastUpdateData()).toMatchObject({ quantity: 15, name: "SÜT" });
    const txData = (prisma.stockTransaction.create as jest.Mock).mock.calls[0][0]?.data;
    expect(txData).toMatchObject({ change: 5, reason: "MANUAL", stockItemId: 10, companyId: "company-1" });
  });

  it("miktar aynıysa işlem oluşturmaz, sadece günceller", async () => {
    (prisma.stockItem.findFirst as jest.Mock).mockResolvedValue(existingItem({ quantity: 10 }));

    const res = mockRes();
    await updateStockItem(mockReq({ params: { id: "10" }, body: { name: "SÜT X", quantity: 10 } }), res);

    expect(lastUpdateData()).toMatchObject({ name: "SÜT X" });
    expect(prisma.stockTransaction.create).not.toHaveBeenCalled();
  });

  it("ürün bulunamazsa 404 döner", async () => {
    (prisma.stockItem.findFirst as jest.Mock).mockResolvedValue(null);

    const res = mockRes();
    await updateStockItem(mockReq({ params: { id: "999" }, body: { name: "YOK" } }), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("listStockItems", () => {
  const items = Array.from({ length: 45 }, (_, i) =>
    existingItem({
      id: i + 1,
      name: `Ürün ${i + 1}`,
      quantity: i < 10 ? 1 : 20,
      minQuantity: 5,
      lowStockAlert: true,
      unitPrice: 100,
      currency: "TRY",
    })
  );

  beforeEach(() => {
    (prisma.stockItem.count as jest.Mock).mockResolvedValue(items.length);
    (prisma.$queryRaw as jest.Mock).mockImplementation((strings: TemplateStringsArray) => {
      const sql = Array.isArray(strings) ? strings.join("") : String(strings);
      if (sql.includes("lowStockAlert")) return Promise.resolve([{ count: 10 }]);
      return Promise.resolve([{ currency: "TRY", total: 10 * 1 * 100 + 35 * 20 * 100 }]);
    });
  });

  it("page + size ile sayfalar:", async () => {
    (prisma.stockItem.findMany as jest.Mock).mockImplementation(({ skip, take }: any) =>
      Promise.resolve(items.slice(skip || 0, take != null ? skip + take : items.length))
    );

    const res = mockRes();
    await listStockItems(mockReq({ query: { page: "1", size: "20" } }), res);

    expect(res.status).not.toHaveBeenCalled();
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.content).toHaveLength(20);
    expect(body.content[0].name).toBe("Ürün 21");
    expect(body.totalElements).toBe(45);
    expect(body.totalPages).toBe(3);
    expect(body.number).toBe(1);
    expect(body.size).toBe(20);
    expect(body.totalProducts).toBe(45);
  });

  it("low=true ise sadece kritik seviye altındaki ürünler döner", async () => {
    (prisma.stockItem.findMany as jest.Mock).mockResolvedValue(items);

    const res = mockRes();
    await listStockItems(mockReq({ query: { low: "true", page: "0", size: "20" } }), res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.content).toHaveLength(10);
    expect(body.totalElements).toBe(10);
    expect(body.totalPages).toBe(1);
  });

  it("lowStockCount ve totalByCurrency tüm ürünler üzerinden hesaplanır", async () => {
    (prisma.stockItem.findMany as jest.Mock).mockResolvedValue(items);

    const res = mockRes();
    await listStockItems(mockReq({ query: {} }), res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.lowStockCount).toBe(10);
    expect(body.totalByCurrency).toEqual({ TRY: 10 * 1 * 100 + 35 * 20 * 100 });
  });
});