import {
  devLogin,
  getStats,
  listAdminKeys,
  createAdminKey,
  updateAdminKey,
  deleteAdminKey,
  listUsers,
  updateUser,
  deleteUser,
  listCompanies,
  getCompany,
  updateCompany,
} from "../controllers/devController";
import prisma from "../prisma";
import { Request } from "express";
import { generateDevToken } from "../services/jwt";

jest.mock("../services/jwt");
jest.mock("bcryptjs");

jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    company: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    adminKey: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    customer: { count: jest.fn() },
    serviceRecord: { count: jest.fn() },
    team: { count: jest.fn() },
    appointment: { count: jest.fn() },
  },
}));

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return { body: {}, params: {}, query: {}, ...overrides } as Request;
}

const ORIGINAL_DEV_EMAIL = process.env.DEV_EMAIL;
const ORIGINAL_DEV_PASSWORD = process.env.DEV_PASSWORD;

describe("dev controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DEV_EMAIL = "admin@loomy.com";
    process.env.DEV_PASSWORD = "super-secret";
  });

  afterAll(() => {
    process.env.DEV_EMAIL = ORIGINAL_DEV_EMAIL;
    process.env.DEV_PASSWORD = ORIGINAL_DEV_PASSWORD;
  });

  describe("devLogin", () => {
    it("returns 400 when missing fields", async () => {
      const res = mockRes();
      await devLogin(mockReq({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "E-posta ve şifre zorunludur." });
    });

    it("returns 500 when dev credentials not configured", async () => {
      delete process.env.DEV_EMAIL;
      delete process.env.DEV_PASSWORD;

      const res = mockRes();
      await devLogin(mockReq({ body: { email: "a", password: "b" } }), res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Dev giriş bilgileri yapılandırılmamış.",
      });
    });

    it("returns 401 for wrong credentials", async () => {
      const res = mockRes();
      await devLogin(
        mockReq({ body: { email: "admin@loomy.com", password: "wrong" } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "E-posta veya şifre hatalı." });
    });

    it("returns token on success", async () => {
      (generateDevToken as jest.Mock).mockReturnValue("dev-token");

      const res = mockRes();
      await devLogin(
        mockReq({ body: { email: "ADMIN@loomy.com", password: "super-secret" } }),
        res
      );

      expect(generateDevToken).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        token: "dev-token",
        email: "admin@loomy.com",
      });
    });
  });

  describe("getStats", () => {
    it("returns aggregated counts", async () => {
      (prisma.company.count as jest.Mock).mockResolvedValue(3);
      (prisma.user.count as jest.Mock).mockResolvedValue(10);
      (prisma.adminKey.count as jest.Mock).mockResolvedValue(5);
      (prisma.customer.count as jest.Mock).mockResolvedValue(2);
      (prisma.serviceRecord.count as jest.Mock).mockResolvedValue(4);
      (prisma.team.count as jest.Mock).mockResolvedValue(1);
      (prisma.appointment.count as jest.Mock).mockResolvedValue(6);

      const res = mockRes();
      await getStats(mockReq(), res);

      const result = res.json.mock.calls[0][0];
      expect(result.companies).toBe(3);
      expect(result.users).toBe(10);
      expect(result.adminKeys).toBe(5);
      expect(result.customers).toBe(2);
      expect(result.services).toBe(4);
    });
  });

  describe("createAdminKey", () => {
    it("generates keys with ADMIN- prefix", async () => {
      (prisma.adminKey.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.adminKey.create as jest.Mock).mockImplementation(async ({ data }) => ({
        id: "k",
        keyValue: data.keyValue,
      }));

      const res = mockRes();
      await createAdminKey(mockReq({ body: { count: 2 } }), res);

      expect(res.status).toHaveBeenCalledWith(201);
      const created = res.json.mock.calls[0][0].created;
      expect(created).toHaveLength(2);
      expect(created[0].keyValue.startsWith("ADMIN-")).toBe(true);
    });

    it("clamps count between 1 and 20", async () => {
      (prisma.adminKey.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.adminKey.create as jest.Mock).mockImplementation(async ({ data }) => ({
        keyValue: data.keyValue,
      }));

      const res = mockRes();
      await createAdminKey(mockReq({ body: { count: 999 } }), res);

      const created = res.json.mock.calls[0][0].created;
      expect(created).toHaveLength(20);
    });
  });

  describe("updateAdminKey", () => {
    it("returns 404 when key not found", async () => {
      (prisma.adminKey.findUnique as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await updateAdminKey(mockReq({ params: { id: "x" }, body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("clears used fields when isUsed set to false", async () => {
      (prisma.adminKey.findUnique as jest.Mock).mockResolvedValue({ id: "k" });
      (prisma.adminKey.update as jest.Mock).mockResolvedValue({});

      const res = mockRes();
      await updateAdminKey(
        mockReq({ params: { id: "k" }, body: { isUsed: false } }),
        res
      );

      const data = (prisma.adminKey.update as jest.Mock).mock.calls[0][0].data;
      expect(data.isUsed).toBe(false);
      expect(data.usedByCompanyId).toBeNull();
      expect(data.usedAt).toBeNull();
    });
  });

  describe("updateUser (dev)", () => {
    it("returns 404 when user not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await updateUser(mockReq({ params: { id: "x" }, body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("resets password and returns temp password", async () => {
      const bcrypt = require("bcryptjs");
      bcrypt.hash.mockResolvedValue("hashed");

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1" });
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: "u1" });

      const res = mockRes();
      await updateUser(
        mockReq({ params: { id: "u1" }, body: { resetPassword: true } }),
        res
      );

      const result = res.json.mock.calls[0][0];
      expect(result.tempPassword).toBeDefined();
      const data = (prisma.user.update as jest.Mock).mock.calls[0][0].data;
      expect(data.password).toBe("hashed");
    });

    it("updates role and isActive", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1" });
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: "u1" });

      const res = mockRes();
      await updateUser(
        mockReq({ params: { id: "u1" }, body: { isActive: false, role: "ADMIN" } }),
        res
      );

      const data = (prisma.user.update as jest.Mock).mock.calls[0][0].data;
      expect(data.isActive).toBe(false);
      expect(data.role).toBe("ADMIN");
    });
  });

  describe("deleteUser (dev)", () => {
    it("returns 404 when user not found", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await deleteUser(mockReq({ params: { id: "x" } }), res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("deletes company when no remaining users", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "u1",
        companyId: "c1",
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(0);

      const res = mockRes();
      await deleteUser(mockReq({ params: { id: "u1" } }), res);

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
      expect(prisma.company.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
    });
  });

  describe("getCompany (dev)", () => {
    it("returns 404 when company not found", async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await getCompany(mockReq({ params: { id: "x" } }), res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Şirket bulunamadı." });
    });
  });

  describe("updateCompany (dev)", () => {
    it("returns 404 when company not found", async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      await updateCompany(mockReq({ params: { id: "x" }, body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("extends paidUntil by one month when markPaid", async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue({
        id: "c1",
        paidUntil: null,
      });
      (prisma.company.update as jest.Mock).mockImplementation(async ({ data }) => ({
        id: "c1",
        ...data,
      }));

      const res = mockRes();
      await updateCompany(
        mockReq({ params: { id: "c1" }, body: { markPaid: true } }),
        res
      );

      const data = (prisma.company.update as jest.Mock).mock.calls[0][0].data;
      expect(data.paidUntil).toBeInstanceOf(Date);
      const sameDay = data.paidUntil.getTime() >= Date.now();
      expect(sameDay).toBe(true);
    });

    it("sets isFrozen", async () => {
      (prisma.company.findUnique as jest.Mock).mockResolvedValue({ id: "c1" });
      (prisma.company.update as jest.Mock).mockImplementation(async ({ data }) => ({
        id: "c1",
        ...data,
      }));

      const res = mockRes();
      await updateCompany(
        mockReq({ params: { id: "c1" }, body: { isFrozen: true } }),
        res
      );

      const data = (prisma.company.update as jest.Mock).mock.calls[0][0].data;
      expect(data.isFrozen).toBe(true);
    });
  });
});
