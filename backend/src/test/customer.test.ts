import {
  getCustomers,
  searchCustomers,
  getAllCustomersSimple,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { Response } from "express";

jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    customer: {
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

describe("customer controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCustomers", () => {
    it("returns paginated customers", async () => {
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([{ id: "1" }]);
      (prisma.customer.count as jest.Mock).mockResolvedValue(25);

      const res = mockRes();
      const req = mockReq({ query: { page: "1", size: "10" } });

      await getCustomers(req, res);

      const where = (prisma.customer.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.companyId).toBe("c1");
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalElements: 25,
          totalPages: 3,
          number: 1,
          size: 10,
          content: [{ id: "1" }],
        })
      );
    });
  });

  describe("searchCustomers", () => {
    it("searches by query across fields", async () => {
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.customer.count as jest.Mock).mockResolvedValue(0);

      const res = mockRes();
      const req = mockReq({ query: { q: "acme", page: "0", size: "20" } });

      await searchCustomers(req, res);

      const where = (prisma.customer.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.OR).toBeDefined();
      expect(where.OR[0].companyName.contains).toBe("acme");
      expect(where.OR[0].companyName.mode).toBe("insensitive");
    });
  });

  describe("getAllCustomersSimple", () => {
    it("returns customers sorted by companyName", async () => {
      (prisma.customer.findMany as jest.Mock).mockResolvedValue([{ id: "1" }]);

      const res = mockRes();
      await getAllCustomersSimple(mockReq(), res);

      const call = (prisma.customer.findMany as jest.Mock).mock.calls[0][0];
      expect(call.orderBy.companyName).toBe("asc");
      expect(call.select).toHaveProperty("id");
      expect(call.select).toHaveProperty("companyName");
    });
  });

  describe("getCustomerById", () => {
    it("returns 404 when not found", async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await getCustomerById(mockReq({ params: { id: "x" } }), res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns customer scoped to company", async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue({ id: "c1" });

      const res = mockRes();
      await getCustomerById(mockReq({ params: { id: "c1" } }), res);

      const where = (prisma.customer.findFirst as jest.Mock).mock.calls[0][0].where;
      expect(where).toEqual({ id: "c1", companyId: "c1" });
      expect(res.json).toHaveBeenCalledWith({ id: "c1" });
    });
  });

  describe("createCustomer", () => {
    it("returns 400 when companyName missing", async () => {
      const res = mockRes();
      await createCustomer(mockReq({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Şirket adı zorunludur." });
    });

    it("creates customer with trimmed fields", async () => {
      (prisma.customer.create as jest.Mock).mockResolvedValue({ id: "new" });

      const res = mockRes();
      const req = mockReq({
        body: {
          companyName: "  Acme  ",
          subscriberNo: " 123 ",
          phone: " 555 ",
        },
      });

      await createCustomer(req, res);

      const data = (prisma.customer.create as jest.Mock).mock.calls[0][0].data;
      expect(data.companyName).toBe("Acme");
      expect(data.subscriberNo).toBe("123");
      expect(data.phone).toBe("555");
      expect(data.companyId).toBe("c1");
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("updateCustomer", () => {
    it("returns 404 when not found", async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await updateCustomer(mockReq({ params: { id: "x" }, body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("updates only provided fields", async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue({
        id: "c1",
        companyName: "Old",
        subscriberNo: null,
        address: null,
        email: null,
        phone: null,
        fax: null,
        website: null,
        contactPerson: null,
        contactPhone: null,
      });
      (prisma.customer.update as jest.Mock).mockImplementation(
        async ({ data }) => data
      );

      const res = mockRes();
      await updateCustomer(mockReq({ params: { id: "c1" }, body: { companyName: "New" } }), res);

      const data = (prisma.customer.update as jest.Mock).mock.calls[0][0].data;
      expect(data.companyName).toBe("New");
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("deleteCustomer", () => {
    it("returns 404 when not found", async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await deleteCustomer(mockReq({ params: { id: "x" } }), res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("deletes on success", async () => {
      (prisma.customer.findFirst as jest.Mock).mockResolvedValue({ id: "c1" });

      const res = mockRes();
      await deleteCustomer(mockReq({ params: { id: "c1" } }), res);

      expect(prisma.customer.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
      expect(res.json).toHaveBeenCalledWith({ message: "Müşteri silindi." });
    });
  });
});
