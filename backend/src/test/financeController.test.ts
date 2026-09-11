import { getFinanceOverview } from "../controllers/financeController";
import prisma from "../prisma";

jest.mock("../prisma", () => {
  const model = () => ({
    findMany: jest.fn(),
  });
  return {
    __esModule: true,
    default: {
      stockItem: model(),
      invoice: model(),
      serviceRecord: model(),
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
    ...partial,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getFinanceOverview", () => {
  it("stok, gider (fatura) ve servis ödemelerini kur bazında özetler", async () => {
    (prisma.stockItem.findMany as jest.Mock).mockResolvedValue([
      { quantity: 10, unitPrice: 100, currency: "TRY" }, // 1000 TRY
      { quantity: 5, unitPrice: 20, currency: "USD" },   // 100 USD
      { quantity: 3, unitPrice: null, currency: "TRY" }, // fiyatsız → yok sayılır
    ]);
    (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
      { totalAmount: 250, currency: "TRY" },
      { totalAmount: 50, currency: "USD" },
      { totalAmount: null, currency: "TRY" },
    ]);
    (prisma.serviceRecord.findMany as jest.Mock).mockResolvedValue([
      { fee: "1000.00", paid: true },
      { fee: "500.00", paid: false },
      { fee: "0.00", paid: false },
    ]);

    const res = mockRes();
    await getFinanceOverview(mockReq(), res);

    expect(res.status).not.toHaveBeenCalled();
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.stockByCurrency).toEqual({ TRY: 1000, USD: 100 });
    expect(body.expenseByCurrency).toEqual({ TRY: 250, USD: 50 });
    expect(body.paidTotal).toBe(1000);
    expect(body.pendingTotal).toBe(500);
    expect(body.paidCount).toBe(1);
    expect(body.pendingCount).toBe(2);
  });

  it("boş veriyle sıfır toplamlar döner", async () => {
    (prisma.stockItem.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.serviceRecord.findMany as jest.Mock).mockResolvedValue([]);

    const res = mockRes();
    await getFinanceOverview(mockReq(), res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.stockByCurrency).toEqual({});
    expect(body.expenseByCurrency).toEqual({});
    expect(body.paidTotal).toBe(0);
    expect(body.pendingTotal).toBe(0);
  });

  it("hata durumunda 500 döner", async () => {
    (prisma.stockItem.findMany as jest.Mock).mockRejectedValue(new Error("db down"));

    const res = mockRes();
    await getFinanceOverview(mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});