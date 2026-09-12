import {
  getPayments,
  getPaymentSummary,
  updatePaymentStatus,
} from "../controllers/paymentController";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { Response } from "express";

jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    serviceRecord: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
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
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    body: {},
    params: {},
    query: {},
    user: { id: "u1", email: "a@b.com", role: "ADMIN", companyId: "c1" },
    ...overrides,
  } as AuthRequest;
}

describe("payment controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
  });

  describe("getPayments", () => {
    it("maps service records to payment shape", async () => {
      (prisma.serviceRecord.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          customerName: "M",
          customerId: 5,
          documentDate: "08/09/2026",
          serviceType: "Bakim",
          fee: "150.50",
          paid: true,
        },
      ]);
      (prisma.serviceRecord.count as jest.Mock).mockResolvedValue(1);

      const res = mockRes();
      await getPayments(mockReq(), res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          content: [
            {
              id: 1,
              customer: "M",
              customerId: 5,
              tarih: "08/09/2026",
              serviceType: "Bakim",
              amount: 150.5,
              paid: true,
            },
          ],
        })
      );
    });
  });

  describe("getPaymentSummary", () => {
    function mockSummary(rows: any[]) {
      (prisma.monthlyFinanceSummary.count as jest.Mock).mockResolvedValue(1);
      (prisma.monthlyFinanceSummary.findMany as jest.Mock).mockImplementation((args: any) => {
        if (args?.select?.period) {
          return Promise.resolve([{ period: "2026-09", updatedAt: new Date() }]);
        }
        return Promise.resolve(rows);
      });
    }

    it("computes paid/pending totals", async () => {
      mockSummary([
        { receivedTotal: 150, pendingTotal: 200, receivedCount: 2, pendingCount: 2 },
        { receivedTotal: 40, pendingTotal: 60, receivedCount: 1, pendingCount: 1 },
      ]);

      const res = mockRes();
      await getPaymentSummary(mockReq(), res);

      expect(res.json).toHaveBeenCalledWith({
        paidTotal: 190,
        pendingTotal: 260,
        total: 450,
        paidCount: 3,
        pendingCount: 3,
        totalCount: 6,
      });
    });

    it("handles missing/invalid fees", async () => {
      mockSummary([
        { receivedTotal: 0, pendingTotal: 0, receivedCount: 0, pendingCount: 2 },
      ]);

      const res = mockRes();
      await getPaymentSummary(mockReq(), res);

      const result = res.json.mock.calls[0][0];
      expect(result.paidTotal).toBe(0);
      expect(result.pendingTotal).toBe(0);
      expect(result.totalCount).toBe(2);
    });
  });

  describe("updatePaymentStatus", () => {
    it("returns 404 when record not found", async () => {
      (prisma.serviceRecord.findFirst as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await updatePaymentStatus(mockReq({ params: { id: "1" } }), res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Servis kaydı bulunamadı." });
    });

    it("toggles paid when not provided", async () => {
      (prisma.serviceRecord.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        paid: false,
      });
      (prisma.serviceRecord.update as jest.Mock).mockResolvedValue({
        id: 1,
        customerName: "M",
        customerId: 5,
        documentDate: "d",
        serviceType: "Bakim",
        fee: "100.00",
        paid: true,
      });

      const res = mockRes();
      await updatePaymentStatus(mockReq({ params: { id: "1" }, body: {} }), res);

      const data = (prisma.serviceRecord.update as jest.Mock).mock.calls[0][0].data;
      expect(data.paid).toBe(true);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ paid: true, amount: 100 })
      );
    });

    it("uses provided paid value", async () => {
      (prisma.serviceRecord.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        paid: true,
      });
      (prisma.serviceRecord.update as jest.Mock).mockResolvedValue({
        id: 1,
        customerName: "M",
        customerId: null,
        documentDate: "d",
        serviceType: "",
        fee: "0",
        paid: false,
      });

      const res = mockRes();
      await updatePaymentStatus(
        mockReq({ params: { id: "1" }, body: { paid: false } }),
        res
      );

      const data = (prisma.serviceRecord.update as jest.Mock).mock.calls[0][0].data;
      expect(data.paid).toBe(false);
    });
  });
});
