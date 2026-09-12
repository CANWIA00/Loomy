import { getFinanceOverview } from "../controllers/financeController";
import prisma from "../prisma";

jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    stockItem: {
      findMany: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
    },
    serviceRecord: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

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
    (prisma.$queryRaw as jest.Mock).mockImplementation((strings: TemplateStringsArray) => {
      const sql = Array.isArray(strings) ? strings.join("") : String(strings);
      if (sql.includes('"Invoice"')) {
        return Promise.resolve([
          { currency: "TRY", total: 250 },
          { currency: "USD", total: 50 },
        ]);
      }
      if (sql.includes('"ServiceRecord"')) {
        return Promise.resolve([{ paidTotal: 1000, pendingTotal: 500, paidCount: 1, pendingCount: 2 }]);
      }
      return Promise.resolve([
        { currency: "TRY", total: 1000 },
        { currency: "USD", total: 100 },
      ]);
    });

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
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

    const res = mockRes();
    await getFinanceOverview(mockReq(), res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.stockByCurrency).toEqual({});
    expect(body.expenseByCurrency).toEqual({});
    expect(body.paidTotal).toBe(0);
    expect(body.pendingTotal).toBe(0);
  });

  it("hata durumunda 500 döner", async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error("db down"));

    const res = mockRes();
    await getFinanceOverview(mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});