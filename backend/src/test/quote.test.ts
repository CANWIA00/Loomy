import {
  getQuoteRecords,
  createQuoteRecord,
  updateQuoteRecord,
  deleteQuoteRecord,
} from "../controllers/quoteController";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { Response } from "express";

jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    quoteRecord: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

function mockRes() {
  const res = {} as Response;
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

describe("quote controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getQuoteRecords", () => {
    it("returns paginated quotes scoped to company", async () => {
      (prisma.quoteRecord.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);
      (prisma.quoteRecord.count as jest.Mock).mockResolvedValue(1);

      const res = mockRes();
      await getQuoteRecords(mockReq(), res);

      const where = (prisma.quoteRecord.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.companyId).toBe("c1");
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ totalElements: 1, totalPages: 1 })
      );
    });
  });

  describe("createQuoteRecord", () => {
    it("returns 400 when customerName missing", async () => {
      const res = mockRes();
      await createQuoteRecord(mockReq({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Müşteri adı zorunludur." });
    });

    it("stringifies lines and sets defaults", async () => {
      (prisma.quoteRecord.create as jest.Mock).mockResolvedValue({ id: 1 });

      const res = mockRes();
      const req = mockReq({ body: { customerName: "M", lines: [{ desc: "x" }] } });

      await createQuoteRecord(req, res);

      const data = (prisma.quoteRecord.create as jest.Mock).mock.calls[0][0].data;
      expect(data.customerName).toBe("M");
      expect(data.lines).toBe('[{"desc":"x"}]');
      expect(data.companyId).toBe("c1");
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("updateQuoteRecord", () => {
    it("returns 404 when not found", async () => {
      (prisma.quoteRecord.findFirst as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await updateQuoteRecord(mockReq({ params: { id: "1" }, body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Teklif kaydı bulunamadı." });
    });

    it("updates fields", async () => {
      (prisma.quoteRecord.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        documentDate: "d",
        customerName: "Old",
        customerId: null,
        contactPerson: null,
        email: null,
        phone: null,
        fax: null,
        website: null,
        subscriberNo: null,
        address: null,
        notes: null,
        lines: "[]",
        validUntil: null,
        tryRates: null,
      });
      (prisma.quoteRecord.update as jest.Mock).mockImplementation(
        async ({ data }) => data
      );

      const res = mockRes();
      const req = mockReq({
        params: { id: "1" },
        body: { customerName: "New" },
      });

      await updateQuoteRecord(req, res);

      const data = (prisma.quoteRecord.update as jest.Mock).mock.calls[0][0].data;
      expect(data.customerName).toBe("New");
      expect(data.lines).toBe("[]");
    });
  });

  describe("deleteQuoteRecord", () => {
    it("returns 404 when not found", async () => {
      (prisma.quoteRecord.findFirst as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await deleteQuoteRecord(mockReq({ params: { id: "1" } }), res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("deletes on success", async () => {
      (prisma.quoteRecord.findFirst as jest.Mock).mockResolvedValue({ id: 1 });

      const res = mockRes();
      await deleteQuoteRecord(mockReq({ params: { id: "1" } }), res);

      expect(prisma.quoteRecord.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(res.json).toHaveBeenCalledWith({ message: "Teklif kaydı silindi." });
    });
  });
});
