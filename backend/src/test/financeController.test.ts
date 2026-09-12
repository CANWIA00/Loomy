import { getFinanceOverview, getFinanceTimeline } from "../controllers/financeController";
import prisma from "../prisma";

jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    monthlyFinanceSummary: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
      createMany: jest.fn(),
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
    query: {},
    ...partial,
  };
}

function monthsAgo(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function freshRows(periods: string[]): any[] {
  return periods.map((period) => ({ period, updatedAt: new Date() }));
}

function mockBasics(periods: string[], dataRows: any[]): void {
  (prisma.monthlyFinanceSummary.count as jest.Mock).mockResolvedValue(1);
  (prisma.monthlyFinanceSummary.findMany as jest.Mock).mockImplementation((args: any) => {
    if (args?.select?.period) {
      return Promise.resolve(freshRows(periods));
    }
    return Promise.resolve(dataRows);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getFinanceOverview", () => {
  it("stok ve aylık özet tablosunu kur bazında özetler", async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([
      { currency: "TRY", total: 1000 },
      { currency: "USD", total: 100 },
    ]);
    mockBasics([monthsAgo(0), monthsAgo(1)], [
      {
        expenseByCurrency: JSON.stringify({ TRY: 250, USD: 50 }),
        receivedTotal: 1000,
        pendingTotal: 500,
        receivedCount: 1,
        pendingCount: 2,
      },
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
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
    mockBasics([monthsAgo(0), monthsAgo(1)], []);

    const res = mockRes();
    await getFinanceOverview(mockReq(), res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.stockByCurrency).toEqual({});
    expect(body.expenseByCurrency).toEqual({});
    expect(body.paidTotal).toBe(0);
    expect(body.pendingTotal).toBe(0);
  });

  it("hata durumunda 500 döner", async () => {
    mockBasics([monthsAgo(0), monthsAgo(1)], []);
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error("db down"));

    const res = mockRes();
    await getFinanceOverview(mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("getFinanceTimeline", () => {
  it("dönem bazlı serileri döndürür", async () => {
    const curMonth = monthsAgo(0);
    const prevMonth = monthsAgo(1);

    (prisma.$queryRaw as jest.Mock).mockImplementation((strings: TemplateStringsArray) => {
      const sql = Array.isArray(strings) ? strings.join("") : String(strings);
      if (sql.includes('"StockItem"')) {
        return Promise.resolve([{ currency: "TRY", total: 1000 }]);
      }
      return Promise.resolve([]);
    });

    const periods = Array.from({ length: 12 }, (_, i) => monthsAgo(i));
    mockBasics(periods, [
      {
        period: curMonth,
        stockDeltaByCurrency: JSON.stringify({ TRY: 200 }),
        expenseByCurrency: "{}",
        receivedTotal: 400,
        pendingTotal: 100,
        receivedCount: 1,
        pendingCount: 1,
      },
      {
        period: prevMonth,
        stockDeltaByCurrency: "{}",
        expenseByCurrency: JSON.stringify({ TRY: 250 }),
        receivedTotal: 0,
        pendingTotal: 0,
        receivedCount: 0,
        pendingCount: 0,
      },
    ]);

    const res = mockRes();
    await getFinanceTimeline(mockReq({ query: { months: "12" } }), res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.periods).toHaveLength(12);
    expect(body.periods[body.periods.length - 1]).toBe(curMonth);
    expect(body.received).toHaveLength(12);
    expect(body.received[body.periods.indexOf(curMonth)]).toBe(400);
    expect(body.pending[body.periods.indexOf(curMonth)]).toBe(100);
    expect(body.stockByCurrency.TRY).toHaveLength(12);
    expect(body.stockByCurrency.TRY[body.periods.length - 1]).toBe(1000);
    expect(body.stockByCurrency.TRY[body.periods.indexOf(prevMonth)]).toBe(800);
    expect(body.expenseByCurrency.TRY[body.periods.indexOf(prevMonth)]).toBe(250);
  });

  it("boş veride sıfır dolu seriler döner", async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
    mockBasics(Array.from({ length: 12 }, (_, i) => monthsAgo(i)), []);

    const res = mockRes();
    await getFinanceTimeline(mockReq(), res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.periods).toHaveLength(12);
    expect(body.received.every((v: number) => v === 0)).toBe(true);
    expect(body.pending.every((v: number) => v === 0)).toBe(true);
    expect(Object.keys(body.stockByCurrency)).toHaveLength(0);
    expect(Object.keys(body.expenseByCurrency)).toHaveLength(0);
  });

  it("months parametresi 24 ile sınırlanır", async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
    mockBasics(Array.from({ length: 24 }, (_, i) => monthsAgo(i)), []);

    const res = mockRes();
    await getFinanceTimeline(mockReq({ query: { months: "99" } }), res);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.periods).toHaveLength(24);
  });

  it("hata durumunda 500 döner", async () => {
    mockBasics(Array.from({ length: 12 }, (_, i) => monthsAgo(i)), []);
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error("db down"));

    const res = mockRes();
    await getFinanceTimeline(mockReq(), res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});